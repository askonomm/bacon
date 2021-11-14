import parse, { ContentItem } from "./parser.ts";
import scan, { ignorePatterns } from "./scanner.ts";
import { DynamicConfiguration, DynamicConfigurationItem } from "./config.ts";
import { baseDir } from "./main.ts";
import { groupBy, GroupedContentItems } from "./utils.ts";

export interface DynamicContent {
  [key: string]: ContentItem[] | GroupedContentItems[];
}

/**
 * Scans and parses content from `baseDir` according to given
 * `config`, which is a collection of DSL's for constructing
 * dynamic data.
 */
export function contentFromConfiguration(
  config: DynamicConfiguration,
): DynamicContent {
  const dynamicContent: DynamicContent = {};

  Object.entries(config).forEach(([key, value]) => {
    dynamicContent[key] = content(value);
  });

  return dynamicContent;
}

/**
 * Calling `content()` without any arguments will return all of the
 * content items, and since config was not provided, it will never be
 * grouped, thus resulting in an array of just one type of content,
 * which is `ContentItem`.
 */
export default function content(): ContentItem[];

/**
 * However, calling `content()` with the config argument can potentially
 * also result as grouped content, if `config.groupBy` was provided,
 * therefore it can result in either an array of `ContentItem`, or a
 * Record containing the item it was grouped by, and it having the value
 * that is an array of `ContentItem`.
 */
export default function content(
  config: DynamicConfigurationItem,
): ContentItem[] | GroupedContentItems[];

/**
 * Scans and parses content from `baseDir` according to an optional
 * given `config`, which acts as a DSL for constructing dynamic data.
 * If no config was provided it will simply scan and parse all of
 * the content in `baseDir`.
 */
export default function content(
  config?: DynamicConfigurationItem,
) {
  const scanPath = config && config.from
    ? baseDir + "/" + config.from
    : baseDir;

  const contentFiles = scan(scanPath, [
    ignorePatterns.nonMarkdownFiles,
  ]);

  let contentItems = parse(contentFiles);

  // Sort and order
  if (config && config.sortBy) {
    contentItems.sort((a: ContentItem, b: ContentItem) => {
      if (
        config.order && config.order === "desc" &&
        a[config.sortBy!] > b[config.sortBy!]
      ) {
        return -1;
      }

      return 1;
    });
  }

  // Limit
  if (config && config.limit) {
    contentItems = contentItems.slice(0, config.limit);
  }

  // Group
  if (config && config.groupBy) {
    const grouper = config.groupBy.split("|")[0].trim();
    const modifier = config.groupBy.split("|")[1].trim();

    // Group by date without any modifier
    if (grouper === "date" && !modifier) {
      return groupBy(contentItems, (item) => item.date);
    }

    // Group by date with modifier "year"
    if (grouper === "date" && modifier === "year") {
      return groupBy(contentItems, (item) => item.date.split("-")[0].trim());
    }

    // Group by date with modifier "month"
    if (grouper === "date" && modifier === "month") {
      return groupBy(contentItems, (item) => item.date.split("-")[1].trim());
    }

    // Group by date with modifier "day"
    if (grouper === "date" && modifier === "day") {
      return groupBy(contentItems, (item) => item.date.split("-")[2].trim());
    }

    // If we're grouping by anything other than date
    if (grouper !== "date") {
      return groupBy(contentItems, (item) => item[grouper]);
    }
  }

  return contentItems;
}
