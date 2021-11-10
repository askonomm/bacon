import { ensureFileSync } from "./deps.ts";

export default function write(baseDir: string, path: string, data: string) {
  const encoder = new TextEncoder();
  const publicDir = baseDir + "/public";

  if (path.endsWith(".md")) {
    const writePath = publicDir + path.replace(".md", "") + "/index.html";
    console.log("• Writing: " + writePath);
    ensureFileSync(writePath);
    Deno.writeFileSync(writePath, encoder.encode(data));
  }

  if (path.endsWith(".hbs")) {
    const writePath = publicDir + path.replace(".hbs", "");
    console.log("• Writing: " + writePath);
    ensureFileSync(writePath);
    Deno.writeFileSync(writePath, encoder.encode(data));
  }
}
