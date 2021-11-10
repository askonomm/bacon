import { ScannedFile } from "./scanner.ts";
import { marky } from "./deps.ts";

export interface ContentItemMeta {
  [key: string]: string | boolean | Date;
}

export interface ContentItem extends ScannedFile {
  entry: string;
  meta: ContentItemMeta;
}

/**
 * Takes in a presumable Markdown file contents with YAML meta-data that
 * it then tries to parse for said meta-data into a consumable shape.
 *
 * Dates are converted into actual Date objects and boolean strings are
 * converted into actual booleans.
 */
function meta(contents: string): ContentItemMeta {
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
      const value: string = pieces.slice(1).join(":").trim();

      // Turn string booleans into actual booleans
      if (value === "true" || value === "false") {
        meta[key] = value === "true" ? true : false;
      } // Turn string dates into actual dates
      else if (value.match(/\d\d\d\d\-\d\d\-\d\d/)) {
        meta[key] = new Date(value);
      } // Otherwise value is as-is
      else {
        meta[key] = value;
      }
    }
  });

  return meta;
}

/**
 * Takes in a presumable Markdown file contents that it then
 * tries to parse for the Markdown entry, and convert into
 * consumable HTML.
 */
function entry(contents: string): string {
  return marky(contents.replace(/^(---).*?(---)/s, "").trim());
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

    return {
      ...file,
      entry: entry(contents),
      meta: meta(contents),
    };
  });
}
