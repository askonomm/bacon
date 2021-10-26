import { ScannedFile } from "./scanner.ts";

interface ContentItem extends ScannedFile {
    entry: string;
}

interface MarkdownItem extends ContentItem {
    meta: {
        [key: string]: string | Date | number;
    }
}

function parseMarkdown(file: ScannedFile): MarkdownItem {
    return {};
}

function parseTemplate(file: ScannedFile): ContentItem {
    return {};
}

export default function parser(files: ScannedFile[]): ContentItem[] | MarkdownItem[] {
    return files.flatMap(file => {
        // Markdown file?
        if (file.path.endsWith('.md')) {
            return parseMarkdown(file);
        }

        // Handlebars template file?
        if (file.path.endsWith('.hbs')) {
            return parseTemplate(file);
        }

        return [];
    });
}