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
export const baseDir = Deno.cwd();
const partialsDir = baseDir + "/_partials/";
const layoutsDir = baseDir + "/_layouts/";
const decoder = new TextDecoder("utf-8");

/**
 * Puts all the pieces together to produce the final output
 * that is the static site.
 */
function run(): void {
  console.log("🐷 Thinking ...");

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

  // Template files
  const templates = scan(baseDir, [
    ignorePatterns.nonTemplateFiles,
    ignorePatterns.layoutFiles,
    ignorePatterns.partialFiles,
  ]).map((template) => {
    const contents = Deno.readFileSync(template.path);

    return {
      relativePath: template.relativePath,
      contents: decoder.decode(contents),
    };
  });

  // Construct unique layouts from `contentItems` so that we'd have them done
  // in one go and wouldn't need to get them on each use of `build`.
  const layouts: TemplateLayout[] = contentItems
    .map((item) => item.layout)
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
  let partials: TemplatePartial[] = layouts
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

  // Append any partials we find from `templates` that are not yet
  // discovered in the contents of layouts used by content items.
  const templatePartials: TemplatePartial[] = templates
    .flatMap((item) => {
      const matches = item.contents.match(/\{\{\>(.*)\}\}/g);

      return matches?.map((match) => {
        return match.replace("{{>", "").replace("}}", "").trim();
      });
    })
    .filter((item, index, arr) => arr.indexOf(item) === index && item)
    .filter((item) => !partials.find((partial) => partial.name === item))
    .map((partial) => {
      const contents = Deno.readFileSync(partialsDir + partial + ".hbs");

      return {
        name: String(partial),
        contents: decoder.decode(contents),
      };
    });

  partials = partials.concat(templatePartials);

  // BUT, we're not done yet! That's because partials themselves can
  // also include partials, so let's get all the partials from partials,
  // and add them to partials. Yes, I'm aware of how this sounds.
  const partialPartials: TemplatePartial[] = partials
    .flatMap((item) => {
      const matches = item.contents.match(/\{\{\>(.*)\}\}/g);

      return matches?.map((match) => {
        return match.replace("{{>", "").replace("}}", "").trim();
      });
    })
    .filter((item, index, arr) => arr.indexOf(item) === index && item)
    .filter((item) => !partials.find((partial) => partial.name === item))
    .map((partial) => {
      const contents = Deno.readFileSync(partialsDir + partial + ".hbs");

      return {
        name: String(partial),
        contents: decoder.decode(contents),
      };
    });

  partials = partials.concat(partialPartials);

  // Now that we have the content, layouts and partials, we can go ahead
  // and build our final HTML for each of the content items.
  contentItems.forEach((item) => {
    const data: TemplateData = item;

    const layout = item.layout
      ? layouts.find((layout) => layout.name === data.layout)
      : layouts.find((layout) => layout.name === "default");

    const slug = "is_" + item.relativePath
      .replace("/", "")
      .replaceAll("/", "_")
      .replace(/\..*/, "");

    data[slug] = true;

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
  templates.forEach((template) => {
    const slug = "is_" + template.relativePath
      .replace("/", "")
      .replaceAll("/", "_")
      .replace(/\..*/, "");

    const data = {...globalData};
    
    data[slug] = true;

    const html = build(helpers, partials, template, data);

    write(template.relativePath, html);
  });

  // Move all other assets to the public directory.
  const assets = scan(baseDir, [
    ignorePatterns.nonAssetFiles,
  ]);

  assets.forEach((asset) => {
    Deno.copyFileSync(asset.path, baseDir + "/public" + asset.relativePath);
  });
}

// We always run Babe whenever Babe is executed,
// but optionally, we also watch it, and run Babe continuously.
if (Deno.args.includes("watch")) {
  console.log("🐷 Watching ...");
  run();
  watch(run);
} else {
  run();
  Deno.exit();
}
