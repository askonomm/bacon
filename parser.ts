import { ScannedFile } from "./scanner.ts";
import { marky } from "./deps.ts";

interface ContentItem extends ScannedFile {
    entry: string;
}

interface MarkdownItemMeta {
    [key: string]: string | Date | number;
}

interface MarkdownItem extends ContentItem {
    meta: MarkdownItemMeta
}

function parseMarkdownMeta(contents: string): MarkdownItemMeta {
    // Match contents for the YAML meta-data block
    const metaData = contents.match(/^(---).*?(---)/s);

    if (!metaData) {
        return {};
    }

    // Create a item per line
    const metaDataLines = metaData[0].split('\n');

    // Remove matches with just the prefix and suffix in it
    const metaDataLinesPurified = metaDataLines.filter(i => i !== '---');

    // Construct meta-data
    const meta: MarkdownItemMeta = {};

    for (const metaDataLine of metaDataLinesPurified) {
        const pieces = metaDataLine.split(':');

        if (pieces.length > 1) {
            const key = pieces[0].trim();

            // I join the rest by `:`, skipping the first item, 
            // in case the value also contains a colon.
            const value = pieces.slice(1).join(':').trim();

            meta[key] = value;
        }
    }

    return meta;
}

function parseMarkdownEntry(contents: string): string {
    const entry = contents.replace(/^(---).*?(---)/s, '').trim();

    return marky(entry);
}

function parseMarkdown(file: ScannedFile): MarkdownItem {
    const bytes = Deno.readFileSync(file.path);
    const decoder = new TextDecoder('utf-8');
    const contents = decoder.decode(bytes);
    const meta = parseMarkdownMeta(contents);
    const entry = parseMarkdownEntry(contents);
    
    return {
        ...file, 
        entry, 
        meta
    };
}

// function parseTemplate(file: ScannedFile): ContentItem {
//     return ContentItem();
// }

export default function parser(files: ScannedFile[]): ContentItem[] | MarkdownItem[] {
    return files.flatMap(file => {
        // Markdown file?
        if (file.path.endsWith('.md')) {
            return parseMarkdown(file);
        }

        // Handlebars template file?
        if (file.path.endsWith('.hbs')) {
            //return parseTemplate(file);
        }

        return [];
    });
}