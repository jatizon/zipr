import { aliasPrefixes } from "./tsconfigAliases.js";

// Jest's global hooks load outside Jest's module registry, where neither
// moduleNameMapper nor a custom resolver runs, so the ".js" specifiers every
// other file uses would reach Node unresolved — and so would those of anything
// the hooks import. Rewriting at transform time covers the whole tree without
// listing files.
//
// The guard is on the specifier rather than on the importing file: inside this
// project every ".js" specifier really points at a ".ts" file, so the rewrite is
// correct everywhere, while a dependency imported as "pkg/dist/x.js" is left
// alone. Prefixes come from tsconfig.json, so a new alias needs no edit here.
const internalSpecifier = new RegExp(
  `^(\\.{1,2}/|${aliasPrefixes.map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
);

const rewriteInternalJsSpecifiersToTs = () => ({
  visitor: {
    ImportDeclaration({ node }) {
      if (node.source.value.endsWith(".js") && internalSpecifier.test(node.source.value)) {
        node.source.value = node.source.value.replace(/\.js$/, ".ts");
      }
    },
  },
});

export default {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
  plugins: ["babel-plugin-transform-import-meta", rewriteInternalJsSpecifiersToTs],
};
