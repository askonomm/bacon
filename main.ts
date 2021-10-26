import parser from "./parser.ts";
import scanner, { ignorePatterns } from './scanner.ts';

function run() {
    const contentFiles = scanner('../bien.ee', [ignorePatterns.nonMarkdownFiles]);
    const contentItems = parser(contentFiles);
}

run();