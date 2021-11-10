export interface DynamicConfigurationItem {
  from: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface DynamicConfiguration {
  [key: string]: DynamicConfigurationItem;
}

export interface Configuration {
  static: {
    [key: string]: unknown;
  };
  dynamic: DynamicConfiguration;
}

export function config(path: string): Configuration {
  const decoder = new TextDecoder("utf-8");
  const contents = Deno.readFileSync(path);

  return JSON.parse(decoder.decode(contents));
}
