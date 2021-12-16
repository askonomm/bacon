import { baseDir } from "./main.ts";

export type StaticConfiguration = {
  [key: string]: string | boolean | StaticConfiguration;
};

export type DynamicConfigurationItem = {
  from: string;
  sortBy?: string;
  order?: "asc" | "desc";
  groupBy?: string;
  limit?: number;
};

export type DynamicConfiguration = {
  [key: string]: DynamicConfigurationItem;
};

export type Configuration = {
  static: StaticConfiguration;
  dynamic: DynamicConfiguration;
};

/**
 * The `Config` class is responsible for reading the contents
 * of the configuration file on disk named either `babe.json` or
 * `babe.local.json`. If the file with the local suffix is present,
 * that will be loaded instead, to ease the pain of local development.
 */
export default class Config {
  config;

  constructor() {
    const decoder = new TextDecoder("utf-8");

    try {
      const contents = Deno.readFileSync(baseDir + "/local.babe.json");

      this.config = JSON.parse(decoder.decode(contents));
    } catch (_) {
      try {
        const contents = Deno.readFileSync(baseDir + "/babe.json");

        this.config = JSON.parse(decoder.decode(contents));
      } catch (_) {
        this.config = {
          static: {},
          dynamic: {},
        };
      }
    }
  }

  /**
   * When the config is specified as static, we want to return
   * a `StaticConfiguration` type.
   */
  get(config: "static"): StaticConfiguration;

  /**
   * When the config is specified as dynamic, we want to return
   * a `DynamicConfiguration` type.
   */
  get(config: "dynamic"): DynamicConfiguration;

  /**
   * Depending on input returns either a `StaticConfiguration`,
   * `DynamicConfiguraton` or simply both of those as `Configuration` if
   * a specific `config` was not provided.
   */
  get(config?: "static" | "dynamic") {
    if (config === "static") {
      return this.config.static;
    }

    if (config === "dynamic") {
      return this.config.dynamic;
    }

    return this.config;
  }
}
