import { Handlebars } from "./deps.ts";

export interface TemplateHelper {
  name: string;
  fn: (input: string, opts?: any) => string;
}

export interface TemplateLayout {
  name?: string;
  contents: string;
}

export interface TemplatePartial {
  name: string;
  contents: string;
}

export interface TemplateData {
  [key: string]: unknown;
}

/**
 * Builds the final consumable HTML out of given Handlebars
 * `helpers`, `partials`, and a `layout`, fusing it all together with
 * the given `data`.
 */
export default function build(
  helpers: TemplateHelper[],
  partials: TemplatePartial[],
  layout?: TemplateLayout,
  data?: TemplateData,
): string {
  // Register helpers
  helpers.forEach((helper) => {
    Handlebars.registerHelper(helper.name, helper.fn);
  });

  // Register partials
  partials.forEach((partial) => {
    Handlebars.registerPartial(partial.name, partial.contents);
  });

  // Compile template
  return Handlebars.compile(layout?.contents ?? "")(data);
}
