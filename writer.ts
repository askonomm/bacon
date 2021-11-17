import { std } from "./deps.ts";
import { baseDir } from "./main.ts";

/**
 * Writes `data` to a given `path`. If the path ends with `.md`,
 * then it will use the file name as a directory inside of which it
 * will create a index.html file. If however the path ends with a
 * `.hbs`, then it will remove the .hbs from the name and save as-is.
 */
export default function write(path: string, data: string) {
  const encoder = new TextEncoder();
  const publicDir = baseDir + "/public";

  if (path.endsWith(".md")) {
    const writePath = publicDir + path.replace(".md", "") + "/index.html";
    console.log("🐷 Writing: " + writePath.replace(publicDir, ""));
    std.ensureFileSync(writePath);
    Deno.writeFileSync(writePath, encoder.encode(data));
  }

  if (path.endsWith(".hbs")) {
    const writePath = publicDir + path.replace(".hbs", "");
    console.log("🐷 Writing: " + writePath.replace(publicDir, ""));
    std.ensureFileSync(writePath);
    Deno.writeFileSync(writePath, encoder.encode(data));
  }
}
