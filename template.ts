import { Handlebars, std } from "./deps.ts";
import helpers from "./helpers.ts";
import { baseDir, partialsDir } from "./main.ts";

export type TemplateOptions = {
  hash: {
    [key: string]: string;
  };
  fn: (opts?: unknown) => string;
  inverse: () => string;
};

export type TemplateHelper = {
  name: string;
  fn: (context: string | TemplateOptions, options?: TemplateOptions) => string;
};

export type TemplateLayout = {
  name?: string;
  relativePath?: string;
  contents: string;
};

export type TemplatePartial = {
  name: string;
  contents: string;
};

export type TemplateData = {
  [key: string]: unknown;
};

/**
 * Template class is responsible for creating the Handlebars partials,
 * helpers and the eventual HTML that will be written to disk to create
 * the static site.
 */
export default class Template {
  #partials: TemplatePartial[] = [];
  #helpers: TemplateHelper[] = helpers;

  /**
   * For a given `path`, finds all partials used in that file, and
   * any partials within those partials, until all possible partials
   * have been found. It then reads those partials from disk and sets
   * them to state as `this.#partials`, which are of type `TemplatePartial`.
   */
  async setPartialsFrom(path: string) {
    const bytes = await Deno.readFile(path);
    const decoder = new TextDecoder("utf-8");
    const contents = decoder.decode(bytes);
    const matches = contents.match(/\{\{\>(.*)\}\}/g);

    if (matches) {
      for (const match of matches) {
        const name = match.replace("{{>", "").replace("}}", "").trim();

        if (this.#partials.some((partial) => partial.name === name)) {
          continue;
        }

        const bytes = Deno.readFileSync(partialsDir + name + ".hbs");
        const decoder = new TextDecoder("utf-8");
        const contents = decoder.decode(bytes);

        this.#partials.push({
          name,
          contents,
        });

        // Find partials within partials
        await this.setPartialsFrom(partialsDir + name + ".hbs");
      }
    }
  }

  /**
   * Builds the final consumable HTML with a given `layout` and `data`,
   * using the partials and helpers in state.
   */
  html(
    layout?: TemplateLayout,
    data?: TemplateData,
  ): string {
    // Register helpers
    this.#helpers.forEach((helper) => {
      Handlebars.registerHelper(helper.name, helper.fn);
    });

    // Register partials
    this.#partials.forEach((partial) => {
      Handlebars.registerPartial(partial.name, partial.contents);
    });

    // Compile template
    return Handlebars.compile(layout?.contents ?? "")(data);
  }

  /**
   * Writes `data` to a given `path`. If the path ends with `.md`,
   * then it will use the file name as a directory inside of which it
   * will create a index.html file. If however the path ends with a
   * `.hbs`, then it will remove the .hbs from the name and save as-is.
   */
  async write(path: string, data: string) {
    const encoder = new TextEncoder();
    const publicDir = baseDir + "/public";

    if (path.endsWith(".md")) {
      const writePath = publicDir + path.replace(".md", "") + "/index.html";
      console.log("🐷 Writing: " + writePath.replace(publicDir, ""));
      await std.ensureFile(writePath);
      await Deno.writeFile(writePath, encoder.encode(data));
    }

    if (path.endsWith(".hbs")) {
      const writePath = publicDir + path.replace(".hbs", "");
      console.log("🐷 Writing: " + writePath.replace(publicDir, ""));
      await std.ensureFile(writePath);
      await Deno.writeFile(writePath, encoder.encode(data));
    }
  }
}
