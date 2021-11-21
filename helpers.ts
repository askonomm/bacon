import { TemplateHelper } from "./builder.ts";

// deno-lint-ignore no-explicit-any
function formatDate(context: string, data: any): string {
  if (!context || !context.match(/\d\d\d\d\-\d\d-\d\d/)) {
    return "{invalid_date_input}";
  }

  const date = new Date(context);
  const locale = data.hash.locale ?? "en-US";
  const opts = data.hash.opts ? JSON.parse(data.hash.opts) : undefined;
  const dtf = Intl.DateTimeFormat(locale, opts);

  return dtf.format(date);
}

// deno-lint-ignore no-explicit-any
function date(context: string, options: any): string {
  if (!context) {
    return "{invalid_date_format}";
  }

  const date = new Date();
  const locale = options.hash.locale ?? "en-US";
  const opts = context ? JSON.parse(context) : undefined;
  const dtf = Intl.DateTimeFormat(locale, opts);

  return dtf.format(date);
}

// deno-lint-ignore no-explicit-any
function when(this: any, context: any): string {
  // Equality check
  if (context.hash.is && context.hash.data === context.hash.is) {
    return context.fn(this);
  }

  // Inequality check
  if (context.hash.isnt && context.hash.data !== context.hash.isnt) {
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
