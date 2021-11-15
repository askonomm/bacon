import { TemplateHelper } from "./builder.ts";

// deno-lint-ignore no-explicit-any
function formatDate(input: string, data: any): string {
  const date = new Date(input);
  const locale = data.hash.locale ?? "en-US";
  const opts = data.hash.opts ? JSON.parse(data.hash.opts) : undefined;
  const dtf = Intl.DateTimeFormat(locale, opts);

  return dtf.format(date);
}

const helpers: TemplateHelper[] = [{
  name: "format_date",
  fn: formatDate
}];

export default helpers;
