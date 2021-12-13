import run, { baseDir } from "./main.ts";
import { ignorePath, ignorePatterns } from "./scanner.ts";

/**
 * Runs a watcher every 250ms to check if the scan returns a different
 * result, because if it does, we want to call `callback`.
 */
// TODO: feed to the callback only files that have changed, and make the runner only run those files
// for performance reasons.
export default async function watch() {
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
