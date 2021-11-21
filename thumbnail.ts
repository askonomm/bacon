/*import { puppeteer, Page, std } from "./deps.ts";

export async function getPage(): Promise<Page> {
  console.log("🐷 Launching puppeteer for thumbnail generation ...");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 2048, height: 1170 });

  return page;
}

interface ThumbnailOpts {
  title: string;
  background: string;
}

export async function generate(writePath: string, opts: ThumbnailOpts): Promise<boolean> {
  console.log("🐷 Generating thumbnail ...");

  // is the background a hex color?
  if (opts.background.startsWith("#")) {
    const background = opts.background;
  } else {
    const background = `url(${opts.background}) no-repeat;`;
  }

  const page = await getPage();

  await page.setContent(`
    <style>
    * { padding: 0; margin: 0; }
    body { background: red; color: white; }
    </style>
    <h1>${opts.title}</h1>
  `);
  await std.ensureFile(writePath);
  await page.screenshot({ path: writePath })

  return true;
}*/
