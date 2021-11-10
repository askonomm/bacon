import parse, { ContentItem } from "./parser.ts";
import scan, { ignorePatterns } from "./scanner.ts";
import { DynamicConfiguration, DynamicConfigurationItem } from "./utils.ts";

export interface DynamicContent {
  [key: string]: ContentItem[];
}

export function contentFromConfiguration(
  baseDir: string,
  config: DynamicConfiguration,
): DynamicContent {
  const dynamicContent: DynamicContent = {};

  Object.entries(config).forEach(([key, value]) => {
    dynamicContent[key] = content(baseDir, value);
  });

  return dynamicContent;
}

export default function content(
  baseDir: string,
  config?: DynamicConfigurationItem,
): ContentItem[] {
  const scanPath = config && config.from
    ? baseDir + "/" + config.from
    : baseDir;

  const contentFiles = scan(scanPath, [
    ignorePatterns.nonMarkdownFiles,
  ]);

  const contentItems = parse(contentFiles);

  // Sort and order
  if (config && config.sortBy) {
    contentItems.sort((a: ContentItem, b: ContentItem) => {
      if (
        config.order && config.order === "desc" &&
        a.meta[config.sortBy!] > b.meta[config.sortBy!]
      ) {
        return 1;
      }

      return -1;
    });
  }

  // Group

  return contentItems;
}
