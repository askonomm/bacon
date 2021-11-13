import { baseDir } from "./main.ts";

export interface StaticConfiguration {
  [key: string]: string | boolean | StaticConfiguration;
}

export interface DynamicConfigurationItem {
  from: string;
  sortBy?: string;
  order?: "asc" | "desc";
  groupBy?: string;
}

export interface DynamicConfiguration {
  [key: string]: DynamicConfigurationItem;
}

export interface Configuration {
  static: StaticConfiguration;
  dynamic: DynamicConfiguration;
}

/**
 * Reads the configuration JSON file and returns it as
 * a consumable object.
 */
export default function config(): Configuration {
  const decoder = new TextDecoder("utf-8");
  const contents = Deno.readFileSync(baseDir + "/babe.json");

  return JSON.parse(decoder.decode(contents));
}
