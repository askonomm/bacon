import { TemplateHelper, TemplateOptions } from "./template.ts";

/**
 * Formats a given date string into a format specified by
 * `Intl.DateTimeFormatOptions`.
 *
 * Example usage:
 *
 * ```handlebars
 * {{format_date "1992-09-17" locale="en-US" opts='{"year": "numeric"}'}}
 * ```
 */
function formatDate(
  context: string | TemplateOptions,
  data?: TemplateOptions,
): string {
  if (
    !context || typeof context !== "string" || !data ||
    !context.match(/\d\d\d\d\-\d\d-\d\d/)
  ) {
    return "{invalid_date_input}";
  }

  try {
    const date = new Date(context);
    const locale = data.hash.locale ?? "en-US";
    const opts = data.hash.opts ? JSON.parse(data.hash.opts) : undefined;
    const dtf = Intl.DateTimeFormat(locale, opts);

    return dtf.format(date);
  } catch (_) {
    return "{invalid_date_input}";
  }
}

/**
 * Returns a current date with a format specified by
 * `Intl.DateTimeFormatOptions`.
 *
 * Example usage:
 *
 * ```handlebars
 * {{date '{"year": "numeric"}'}}
 * ```
 */
// deno-lint-ignore no-explicit-any
function date(context: string | TemplateOptions, options?: any): string {
  if (!context || typeof context !== "string") {
    return "{invalid_date_format}";
  }

  const date = new Date();
  const locale = options.hash.locale ?? "en-US";
  const opts = context ? JSON.parse(context) : undefined;
  const dtf = Intl.DateTimeFormat(locale, opts);

  return dtf.format(date);
}

/**
 * Returns contents of `when`, when a given data equals comparative data.
 *
 * Example usage:
 *
 * ```handlebars
 * {{#when given=data-goes-here is="some-string"}}
 *   // code to show when the comparison equals truthy
 * {{/when}}
 * ```
 */
// deno-lint-ignore no-explicit-any
function when(this: any, context: string | TemplateOptions): string {
  if (typeof context === "string") {
    return "";
  }

  // Equality check
  if (context.hash.is && context.hash.given === context.hash.is) {
    return context.fn(this);
  }

  // Inequality check
  if (context.hash.isnt && context.hash.given !== context.hash.isnt) {
    return context.fn(this);
  }

  return context.inverse();
}

const helpers: TemplateHelper[] = [{
  name: "format_date",
  fn: formatDate,
}, {
  name: "date",
  fn: date,
}, {
  name: "when",
  fn: when,
}];

export default helpers;
