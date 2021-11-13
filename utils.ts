/**
 * Groups a given `collection` by key.
 */
export function groupBy<T, K extends keyof never>(
  collection: T[],
  getKey: (item: T) => K,
) {
  return collection.reduce((previous, current) => {
    previous[getKey(current)] = [...previous[getKey(current)] || [], current];

    return previous;
  }, {} as Record<K, T[]>);
}
