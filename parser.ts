import { ScannedFile } from "./scanner.ts";
import { marky } from "./deps.ts";
import {
  bold,
  emptyBlock,
  headingBlock,
  horizontalLineBlock,
  inlineCode,
  isCodeBlock,
  isEmptyBlock,
  isHeadingBlock,
  isHorizontalLineBlock,
  isListBlock,
  isQuoteBlock,
  italic,
  linkAndImage,
  listBlock,
  paragraphBlock,
  quoteBlock,
  strikethrough,
} from "https://deno.land/x/marky@v1.1.5/parsers.ts";

export interface ContentItemMeta {
  [key: string]: string;
}

export interface ContentItem extends ScannedFile {
  [key: string]: string;
}

/**
 * Takes in a presumable Markdown file contents with YAML meta-data that
 * it then tries to parse for said meta-data into a consumable shape.
 *
 * Dates are converted into actual Date objects and boolean strings are
 * converted into actual booleans.
 */
function parseMeta(contents: string): ContentItemMeta {
  // Match contents for the YAML meta-data block
  const metaData = contents.match(/^\-\-\-(.*?)\-\-\-/s);

  if (!metaData) {
    return {};
  }

  // Create a item per line
  const metaDataLines = metaData[0].split("\n").filter((i) => i !== "---");

  // Construct meta-data
  const meta: ContentItemMeta = {};

  metaDataLines.forEach((line) => {
    const pieces = line.split(":");

    if (pieces.length > 1) {
      const key = pieces[0].trim();

      // Joining the rest by `:`, skipping the first item,
      // in case the value also contains a colon.
      meta[key] = pieces.slice(1).join(":").trim();
    }
  });

  return meta;
}

function highlightClojure(code: string): string {
  const functions = code.match(/\(([^:].*?)\s/g);

  if (functions) {
    functions.forEach((fn) => {
      code = code.replaceAll(
        fn,
        `(<span class="syntax-fn">${fn.replace("(", "")}</span>`,
      );
    });
  }

  const keywords = code.match(/:(.*?)\s/g);

  if (keywords) {
    keywords.forEach((k) => {
      code = code.replaceAll(k, `<span class="syntax-keyword">${k}</span>`);
    });
  }

  return code;
}

function codeBlock(block: string): string {
  const languageMatch = block.match(/\`\`\`\w+/);
  const language = languageMatch
    ? languageMatch[0].replace("```", "").trim()
    : false;
  let value = "";

  if (language) {
    value = block.replace(/\`\`\`\w+/, "").replace(/\n\`\`\`/, "");

    // Remove first \n if the first line is empty
    if (value.split("\n")[0].trim() === "") {
      value = value.replace("\n", "");
    }

    // Encode
    value = value.replace(/&/g, "&amp;");
    value = value.replace(/</g, "&lt;");
    value = value.replace(/>/g, "&gt;");

    // Code highlight
    if (language === "clojure") {
      value = highlightClojure(value);
    }

    // Replace all line breaks with a `<br>` because otherwise
    // `<pre>` thinks that lines following a \n should have a tab, which is dumb.
    value = value.replaceAll("\n", "<br>");

    return `<pre class="language-${language}"><code>${value}</code></pre>`;
  }

  return `<pre><code>${block.substring(3, block.length - 3)}</code></pre>`;
}

/**
 * Takes in a presumable Markdown file contents that it then
 * tries to parse for the Markdown entry, and convert into
 * consumable HTML.
 */
function parseEntry(contents: string): string {
  return marky(contents.replace(/^(---).*?(---)/s, "").trim(), [
    {
      matcher: isEmptyBlock,
      renderers: [emptyBlock],
    },
    {
      matcher: isHeadingBlock,
      renderers: [
        bold,
        italic,
        inlineCode,
        strikethrough,
        linkAndImage,
        headingBlock,
      ],
    },
    {
      matcher: isCodeBlock,
      renderers: [codeBlock],
    },
    {
      matcher: isHorizontalLineBlock,
      renderers: [horizontalLineBlock],
    },
    {
      matcher: isQuoteBlock,
      renderers: [quoteBlock],
    },
    {
      matcher: isListBlock,
      renderers: [
        bold,
        italic,
        inlineCode,
        strikethrough,
        linkAndImage,
        listBlock,
      ],
    },
    {
      renderers: [
        bold,
        italic,
        inlineCode,
        strikethrough,
        linkAndImage,
        paragraphBlock,
      ],
    },
  ]);
}

/**
 * Takes in an array of ScannedFile's which it then attempts to
 * turn into an array of ContentItem's.
 */
export default function parse(
  files: ScannedFile[],
): ContentItem[] {
  return files.map((file) => {
    const bytes = Deno.readFileSync(file.path);
    const decoder = new TextDecoder("utf-8");
    const contents: string = decoder.decode(bytes);
    const meta = parseMeta(contents);
    const entry = parseEntry(contents);
    const timeToRead = Math.ceil(entry.trim().split(/\s+/).length / 225)
      .toString();

    return {
      ...file,
      ...meta,
      entry,
      slug: file.relativePath.replace("/", "").replace(".md", ""),
      time_to_read: timeToRead,
    };
  });
}
