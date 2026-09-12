import { readFileSync } from "node:fs";

// tsconfig.json is JSONC: trailing commas and comments are legal there and fatal
// to JSON.parse.
const readTsconfig = () => {
  const raw = readFileSync(new URL("./tsconfig.json", import.meta.url), "utf8");

  return JSON.parse(
    raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/.*$/gm, "$1")
      .replace(/,(\s*[}\]])/g, "$1"),
  );
};

// "@src/*" -> "./src/*" becomes { prefix: "@src/", directory: "src" }.
const aliases = Object.entries(readTsconfig().compilerOptions.paths).map(
  ([pattern, [target]]) => ({
    prefix: pattern.replace(/\*$/, ""),
    directory: target.replace(/^\.\//, "").replace(/\/\*$/, ""),
  }),
);

// Both consumers below derive from this list so that adding an alias to
// tsconfig.json is the only edit an alias ever needs.
export const aliasPrefixes = aliases.map(({ prefix }) => prefix);

export const aliasModuleNameMapper = Object.fromEntries(
  aliases.flatMap(({ prefix, directory }) => [
    [`^${prefix}(.*)\\.js$`, `<rootDir>/${directory}/$1`],
    [`^${prefix}(.*)\\.ts$`, `<rootDir>/${directory}/$1.ts`],
    [`^${prefix}(.*)$`, `<rootDir>/${directory}/$1`],
  ]),
);
