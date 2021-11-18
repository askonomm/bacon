import { baseDir } from "./main.ts";
import scan from "./scanner.ts";
import { testing } from "./deps.ts";

/**
 * Runs a watcher every 500ms to check if the scan returns a different
 * result, because if it does, we want to call `callback`.
 */
// TODO: feed to the callback only files that have changed, and make the runner only run those files
// for performance reasons.
export default function watch(callback: () => void): void {
  let files = scan(baseDir);

  setInterval(() => {
    const updatedFiles = scan(baseDir);

    if (!testing.equal(files, updatedFiles)) {
      files = [...updatedFiles];
      callback();
    }
  }, 500);
}
