import { env } from "./deps.ts";
import scan, { ignorePath, ignorePatterns, ScannedFile } from "./scanner.ts";
import Template, { TemplateData, TemplateLayout } from "./template.ts";
import { getContent } from "./content.ts";
import Config from "./config.ts";

// Configuration
export const baseDir = env().BASE_DIR || Deno.cwd();
export const partialsDir = baseDir + "/_partials/";
const layoutsDir = baseDir + "/_layouts/";

/**
 * Puts all the pieces together to produce the final output
 * that is the static site.
 */
async function run(): Promise<void> {
  console.log("🐷 Thinking ...");

  // Init Template.
  const template = new Template();

  // Init Config.
  const config = new Config();

  // Compose global data from the configuration.
  // This includes static configuration, as well as dynamic,
  // DSL generated content.
  const globalData = {
    ...config.get("static"),
    ...await getContent(config.get("dynamic")),
  };

  // Compose content items.
  const contentItems = await getContent();

  // Get template files
  const templateFiles: ScannedFile[] = await scan(baseDir, [
    ignorePatterns.nonTemplateFiles,
    ignorePatterns.layoutFiles,
    ignorePatterns.partialFiles,
  ]);

  // Create an array of `TemplateLayout`'s that are custom pages.
  // These are different from layouts used within Markdown files in 
  // that they allow you to create dynamic pages based on the content
  // available via static configuration or built via the dynamic DSL.
  const templates = await Promise.all(
    templateFiles.map(
      async (template: ScannedFile): Promise<TemplateLayout> => {
        const bytes = await Deno.readFile(template.path);
        const decoder = new TextDecoder("utf-8");
        const contents = decoder.decode(bytes);

        return {
          relativePath: template.relativePath,
          contents,
        };
      },
    ),
  );

  // Construct colelction unique layout names from `contentItems`,
  // so that we'd have them done in one go and wouldn't need to get 
  // them on each use of iteration of a content item build.
  const layoutNames: string[] = contentItems
    .map((item) => item.layout)
    .filter((item, index, arr) => arr.indexOf(item) === index && item)
    .concat("default");

  // Create partials used in template files.
  await Promise.all(
    templateFiles.map(async (item) =>
      await template.setPartialsFrom(item.path)
    ),
  );

  // Create partials used in layouts.
  await Promise.all(
    layoutNames.map(async (item) =>
      await template.setPartialsFrom(layoutsDir + item + ".hbs")
    ),
  );

  // Create an array of `TemplateLayout`'s that are the layouts used
  // by the Markdown content items.
  const layouts = await Promise.all(
    layoutNames.map(async (layout): Promise<TemplateLayout> => {
      const bytes = await Deno.readFile(layoutsDir + layout + ".hbs");
      const decoder = new TextDecoder("utf-8");
      const contents = decoder.decode(bytes);

      return {
        name: String(layout),
        contents,
      };
    }),
  );

  // Now that we have the content, layouts and partials, we can go ahead
  // and build our final HTML for each of the content items and write the 
  // result of that to disk.
  contentItems.forEach((item) => {
    const data: TemplateData = item;

    const layout = item.layout
      ? layouts.find((layout) => layout.name === data.layout)
      : layouts.find((layout) => layout.name === "default");

    const slug = "is_" + item.relativePath
      .replace("/", "")
      .replaceAll("/", "_")
      .replace(/\..*/, "");

    const html = template.html(layout, {
      ...data,
      ...globalData,
      [slug]: true,
    });

    template.write(item.relativePath, html);
  });

  // Babe isn't just a Markdown to HTML site generator, it can also
  // turn Handlebars templates into HTML, and with the combination of
  // the DSL Babe has so you could compose custom data sets from the
  // available content, you can do some pretty dynamic things, like
  // RSS feeds, XML sitemaps, and so on.
  //
  // For example, say you have a `feed.xml.hbs` template, well, that will
  // be generated into `feed.xml`. You see the power of it now? Awesome!
  templates.forEach(async (item) => {
    if (item.relativePath) {
      const slug = "is_" + item.relativePath
        .replace("/", "")
        .replaceAll("/", "_")
        .replace(/\..*/, "");

      const data = { ...globalData, [slug]: true };
      const html = template.html(item, data);

      await template.write(item.relativePath, html);
    }
  });

  // Move all assets to the public directory.
  const assets = await scan(baseDir, [
    ignorePatterns.nonAssetFiles,
  ]);

  assets.forEach(async (asset) => {
    await Deno.copyFile(asset.path, baseDir + "/public" + asset.relativePath);
  });
}

async function watch() {
  console.log("🐷 Watching ...");

  let changeOccured = false;

  for await (const event of Deno.watchFs(baseDir)) {
    const change = event.paths.filter((path) =>
      !ignorePath(path, [ignorePatterns.dotFiles, ignorePatterns.publicFiles])
    ).length > 0;

    if (change && !changeOccured) {
      await run();
      changeOccured = true;

      setTimeout(() => {
        changeOccured = false;
        console.log("🐷 Watching ...");
      }, 250);
    }
  }
}

// We always run Babe whenever Babe is executed,
// but optionally, we also watch it, and run Babe continuously.
if (Deno.args.includes("watch")) {
  await run();
  await watch();
} else {
  await run();
  Deno.exit();
}
