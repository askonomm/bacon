import { ContentItem, parse } from "./parser.ts";
import scan, { ignorePatterns } from "./scanner.ts";
import { DynamicConfiguration, DynamicConfigurationItem } from "./config.ts";
import { baseDir } from "./main.ts";

export type GroupedContentItems = {
  group: string;
  items: ContentItem[];
};

/**
 * Given an input of `items` and a grouping value by `grouper`, will
 * group the `items` by the `grouper` in an array of objects defined
 * as `GroupedContentItems`.
 */
function groupBy(
  items: ContentItem[],
  grouper: { (item: ContentItem): string },
): GroupedContentItems[] {
  const keyFn = grouper instanceof Function
    ? grouper
    : (item: ContentItem) => item[grouper];

  const grouped = items.reduce((objkv, obj) => {
    const value = keyFn(obj);
    objkv[value] = (objkv[value] || []).concat(obj);
    return objkv;
  }, {} as Record<string, ContentItem[]>);

  return Object.entries(grouped).map(([key, value]) => {
    return {
      group: key,
      items: value,
    };
  });
}

/**
 * Groups given `items` with by a `grouper` and an optional
 * `modifier`.
 */
function groupContent(
  items: ContentItem[],
  grouper: string,
  modifier?: string,
): GroupedContentItems[] {
  // Group by date without any modifier
  if (grouper === "date" && !modifier) {
    return groupBy(items, (item) => item.date);
  }

  // Group by date with modifier "year"
  if (grouper === "date" && modifier === "year") {
    return groupBy(
      items,
      (item) => item.date && item.date.split("-")[0].trim(),
    );
  }

  // Group by date with modifier "month"
  if (grouper === "date" && modifier === "month") {
    return groupBy(
      items,
      (item) => item.date && item.date.split("-")[1].trim(),
    );
  }

  // Group by date with modifier "day"
  if (grouper === "date" && modifier === "day") {
    return groupBy(
      items,
      (item) => item.date && item.date.split("-")[2].trim(),
    );
  }

  // If we're grouping by anything other
  return groupBy(items, (item) => item[grouper]);
}

export type DynamicContent = {
  [key: string]: ContentItem[] | GroupedContentItems[];
};

/**
 * Type guard for checking if given `test` is of type
 * `DynamicConfiguration`.
 */
function isDynamicConfiguration(
  test: DynamicConfiguration | DynamicConfigurationItem,
): test is DynamicConfiguration {
  return test.from === undefined;
}

/**
 * Calling `content()` without any arguments will return all of the
 * content items, and since config was not provided, it will never be
 * grouped, thus resulting in an array of just one type of content,
 * which is `ContentItem`.
 */
export async function getContent(): Promise<ContentItem[]>;

/**
 * However, calling `content()` with the config argument can potentially
 * also result as grouped content, if `config.groupBy` was provided,
 * therefore it can result in either an array of `ContentItem`, or a
 * Record containing the item it was grouped by, and it having the value
 * that is an array of `ContentItem`.
 */
export async function getContent(
  config: DynamicConfiguration | DynamicConfigurationItem,
): Promise<ContentItem[] | GroupedContentItems[] | DynamicContent>;

/**
 * Scans and parses content from `baseDir` according to an optional
 * given `config`, which acts as a DSL for constructing dynamic data.
 * If no config was provided it will simply scan and parse all of
 * the content in `baseDir`.
 */
export async function getContent(
  config?: DynamicConfigurationItem | DynamicConfiguration,
) {
  // If the `config` is of type DynamicConfiguration we want to construct
  // the content into a `DynamicContent` object.
  if (config && isDynamicConfiguration(config)) {
    const dynamicContent: DynamicContent = {};

    await Promise.all(
      Object.entries(config).map(
        async ([key, val]) => {
          dynamicContent[key] = await getContent(val) as
            | ContentItem[]
            | GroupedContentItems[];
        },
      ),
    );

    return dynamicContent;
  }

  // Otherwise we might have a `DynamicConfigurationItem` as `config`
  // or we might not, either way, the following will deal with that.
  const scanPath = config && config.from
    ? baseDir + "/" + config.from
    : baseDir;

  const contentFiles = await scan(scanPath, [
    ignorePatterns.nonMarkdownFiles,
  ]);

  let contentItems = await parse(contentFiles);

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

    return groupContent(contentItems, grouper, modifier);
  }

  return contentItems;
}
