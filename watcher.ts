import { baseDir } from "./main.ts";
import scan from "./scanner.ts";
import { testing } from "./deps.ts";

/**
 * Runs a watcher every 500ms to check if the scan returns a different
 * result, because if it does, we want to call `callback`.
 */
// TODO: feed to the callback only files that have changed, and make the runner only run those files
// for performance reasons.
export default async function watch(callback: () => Promise<void>) {
  let files = await scan(baseDir);

  setInterval(async () => {
    const updatedFiles = await scan(baseDir);

    if (!testing.equal(files, updatedFiles)) {
      files = [...updatedFiles];
      await callback();
    }
  }, 500);
}
