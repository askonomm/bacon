export interface ScannedFile {
  path: string;
  relativePath: string;
  modifiedAt: Date | null;
}

// Ready-made patterns for usage.
export const ignorePatterns = {
  dotFiles: /^(?:.*\/)*(\.\w+)/,
  nonMarkdownFiles: /^\/?(?:\w+\/)*(?!.*\.md$).*/,
  nonTemplateFiles: /^\/?(?:\w+\/)*(?!.*\.hbs$).*/,
  layoutFiles: /.*\_layouts\/.*/,
  partialFiles: /.*\_partials\/.*/,
  publicFiles: /.*\public\/.*/,
};

// Patterns that are ignored by default, unless overwritten.
export const defaultIgnorePatterns: RegExp[] = [
  ignorePatterns.dotFiles,
];

/**
 * Checks if `path` matches any of the given `patterns`.
 */
function ignorePath(path: string, patterns: RegExp[]): boolean {
  return patterns
    .map((pattern) => path.match(pattern))
    .filter((match) => match !== null).length > 0;
}

/**
 * Scans a given `path` recursively and returns an array of
 * `ScannedFile` objects. Optionally `ignorePatterns` can be passed,
 * containing regex patterns for file names that should be ignored.
 */
export default function scan(
  path: string,
  ignores: RegExp[] = defaultIgnorePatterns,
): ScannedFile[] {
  const composer = (innerPath: string): ScannedFile[] => {
    const files: ScannedFile[] = [];

    for (const dirEntry of Deno.readDirSync(innerPath)) {
      const parsedPath = innerPath.endsWith("/")
        ? innerPath.substring(0, innerPath.length - 1)
        : innerPath;
      const filePath = parsedPath + "/" + dirEntry.name;

      ignores = ignores.concat(ignorePatterns.publicFiles);

      // Does the filePath match any of the ignores?
      // If yes, we want to skip this iteration.
      if (dirEntry.isFile && ignorePath(filePath, ignores)) continue;

      // Otherwise we're good to continue composing our array.
      const stat = Deno.statSync(filePath);

      if (dirEntry.isDirectory) {
        files.push(...composer(filePath));
      } else {
        files.push({
          path: filePath,
          relativePath: filePath.replace(path, ""),
          modifiedAt: stat.mtime,
        });
      }
    }

    return files;
  };

  return composer(path);
}
