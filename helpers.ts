import { TemplateHelper } from "./builder.ts";
import { canvasTxt, createCanvas, std } from "./deps.ts";
import { baseDir } from "./main.ts";

// deno-lint-ignore no-explicit-any
function formatDate(input: string, data: any): string {
  if (!input || !input.match(/\d\d\d\d\-\d\d-\d\d/)) {
    return "{invalid_date_input}";
  }

  const date = new Date(input);
  const locale = data.hash.locale ?? "en-US";
  const opts = data.hash.opts ? JSON.parse(data.hash.opts) : undefined;
  const dtf = Intl.DateTimeFormat(locale, opts);

  return dtf.format(date);
}

// deno-lint-ignore no-explicit-any
function date(format: string, data: any): string {
  if (!format) {
    return "{invalid_date_format}";
  }

  const date = new Date();
  const locale = data.hash.locale ?? "en-US";
  const opts = format ? JSON.parse(format) : undefined;
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

// deno-lint-ignore no-explicit-any
function cardImage(context: any): string {
  const title = context.hash.title ?? "";
  const slug = title.replaceAll(/\W/g, "").toLowerCase();
  const writePath = baseDir + `/public/card-images/${slug}.png`;
  const color = context.hash.color ?? "#FFFFFF";
  const backgroundColor = context.hash.backgroundColor ?? "#000000";
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.fillStyle = color;

  canvasTxt.font = "Helvetica";
  canvasTxt.fontSize = 30;
  canvasTxt.fontWeight = 800;
  //canvasTxt.align = "center";
  canvasTxt.vAlign = "middle";
  canvasTxt.lineHeight = 40;
  canvasTxt.justify = false;
  canvasTxt.drawText(
    ctx,
    title,
    -(canvas.width / 2) + 200,
    0,
    canvas.width - 200,
    canvas.height,
  );

  // Be done with it
  std.ensureFileSync(writePath);
  Deno.writeFileSync(writePath, canvas.toBuffer());

  return writePath.replace(baseDir + "/public", "");
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
}, {
  name: "cardImage",
  fn: cardImage,
}];

export default helpers;
