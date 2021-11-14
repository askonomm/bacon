import { ContentItem } from "./parser.ts";

export interface GroupedContentItems {
  group: string;
  items: ContentItem[];
}

// deno-lint-ignore no-explicit-any
export function groupBy<T extends Record<string, any>, K extends keyof ContentItem>(
  array: ContentItem[],
  key: K | { (obj: ContentItem): string },
): GroupedContentItems[] {
  const keyFn = key instanceof Function ? key : (obj: ContentItem) => obj[key];

  const grouped = array.reduce((objectsByKeyValue, obj) => {
    const value = keyFn(obj);

    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);

    return objectsByKeyValue;
  }, {} as Record<string, ContentItem[]>);

  const groupedContentItems: GroupedContentItems[] = [];
  
  Object.entries(grouped).forEach(([key, value]) => {
    groupedContentItems.push({
      group: key,
      items: value
    });
  });

  return groupedContentItems;
}
