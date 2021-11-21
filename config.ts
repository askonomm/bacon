import { baseDir } from "./main.ts";

export interface StaticConfiguration {
  [key: string]: string | boolean | StaticConfiguration;
}

export interface DynamicConfigurationItem {
  from: string;
  sortBy?: string;
  order?: "asc" | "desc";
  groupBy?: string;
  limit?: number;
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
export default async function config(): Promise<Configuration> {
  const decoder = new TextDecoder("utf-8");

  // Do we have a local.babe.json? Because if so, we want to read that instead.
  try {
    const contents = await Deno.readFile(baseDir + "/local.babe.json");

    return JSON.parse(decoder.decode(contents));
  } catch (_) {
    try {
      const contents = await Deno.readFile(baseDir + "/babe.json");

      return JSON.parse(decoder.decode(contents));
    } catch (_) {
      return {
        static: {},
        dynamic: {},
      };
    }
  }
}
