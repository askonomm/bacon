import scan, { ignorePatterns } from "./scanner.ts";
import build, {
  TemplateData,
  TemplateLayout,
  TemplatePartial,
} from "./builder.ts";
import write from "./writer.ts";
import helpers from "./helpers.ts";
import config from "./config.ts";
import content, { contentFromConfiguration } from "./content.ts";
import watch from "./watcher.ts";

// Configuration
export const baseDir = "../bien.ee";
const partialsDir = baseDir + "/_partials/";
const layoutsDir = baseDir + "/_layouts/";
const decoder = new TextDecoder("utf-8");

function run(): void {
  // Compose global data from the configuration JSON.
  // This includes static configuration, as well as dynamic,
  // DSL generated content.
  const configuration = config();
  const globalData = {
    ...configuration.static,
    ...contentFromConfiguration(configuration.dynamic),
  };

  // Compose content items
  const contentItems = content();

  // Construct unique layouts from `contentItems` so that we'd have them done
  // in one go and wouldn't need to get them on each use of `build`.
  const layouts: TemplateLayout[] = contentItems
    .map((item) => item.meta.layout)
    .filter((item, index, arr) => arr.indexOf(item) === index && item)
    .concat("default")
    .map((layout) => {
      const contents = Deno.readFileSync(layoutsDir + layout + ".hbs");

      return {
        name: String(layout),
        contents: decoder.decode(contents),
      };
    });

  // Find unique partials used in `layouts` and construct them into an array
  // of `TemplatePartial`. This way the user never has to manually register
  // Handlebars partials.
  const partials: TemplatePartial[] = layouts
    .flatMap((item) => {
      const matches = item.contents.match(/\{\{\>(.*)\}\}/g);

      return matches?.map((match) => {
        return match.replace("{{>", "").replace("}}", "").trim();
      });
    })
    .filter((item, index, arr) => arr.indexOf(item) === index && item)
    .map((partial) => {
      const contents = Deno.readFileSync(partialsDir + partial + ".hbs");

      return {
        name: String(partial),
        contents: decoder.decode(contents),
      };
    });

  // Now that we have the content, layouts and partials, we can go ahead
  // and build our final HTML for each of the content items.
  contentItems.forEach((item) => {
    const data: TemplateData = {
      ...item.meta,
      entry: item.entry,
    };

    const layout = item.meta.layout
      ? layouts.find((layout) => layout.name === data.layout)
      : layouts.find((layout) => layout.name === "default");

    const html = build(helpers, partials, layout, {
      ...data,
      ...globalData,
    });

    write(item.relativePath, html);
  });

  // Babe isn't just a Markdown to HTML site generator, it can also
  // turn Handlebars templates into HTML, and with the combination of
  // the DSL Babe has so you could compose custom data sets from the
  // available content, you can do some pretty dynamic things, like
  // RSS feeds, XML sitemaps, and so on.
  //
  // For example, say you have a `feed.xml.hbs` template, well, that will
  // be generated into `feed.xml`. You see the power of it now? Awesome!
  scan(baseDir, [
    ignorePatterns.nonTemplateFiles,
    ignorePatterns.layoutFiles,
    ignorePatterns.partialFiles,
  ]).forEach((template) => {
    const contents = Deno.readFileSync(template.path);

    const layout = {
      contents: decoder.decode(contents),
    };

    const html = build(helpers, partials, layout, globalData);

    write(template.relativePath, html);
  });
}

// Run!
run();

// Watch?
if (Deno.args.includes("watch")) watch(run);