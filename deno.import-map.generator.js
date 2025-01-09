"use strict";

const fs = require("fs");
const glob = require("glob");
const path = require("path");

process.chdir(__dirname);

const TEST_PATH = "test";
const LIB_ESM_PATH = "lib/esm";
const LIB_ALIAS = "#lib";
const LIB_ALIAS_DENO = "#lib/deno";

let imports = {
  "chai": "./node_modules/chai/index.mjs",
  "moq.ts/internal": "./node_modules/moq.ts/fesm2015/moq.ts.js",
  "moq.ts": "./node_modules/moq.ts/fesm2015/moq.ts.js"
};

console.log("Generating import map for Deno tests...");

const platformDirs = glob.globSync(TEST_PATH + "/*/index.ts", { absolute: true })
  .map(file => path.dirname(file))
  .filter(dir => path.basename(dir) !== "deno");

for (const file of glob.globIterateSync(TEST_PATH + "/**/*.ts", { absolute: true })) {
  if (platformDirs.some(dir => file.startsWith(dir))) continue;

  const fileContent = fs.readFileSync(file, "utf8");
  const regex = /(?:import|from)\s*('|")([.#].*?)\1()/g;
  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    let specifier = match[2], resolvedFilePath;
    [specifier, resolvedFilePath] = (specifier.startsWith(".") ? resolveRelativeSpecifier : resolveAliasedSpecifier)(specifier, file);
    if (resolvedFilePath == null) {
      console.error(`Import specifier '${specifier}' could not be resolved.`);
      process.exit(1);
    }
    imports[specifier] = resolvedFilePath;
  }
}

imports = Object.keys(imports).sort().reduce((result, key) => (result[key] = imports[key], result), {});

const importMapJson = JSON.stringify({ imports }, void 0, "  ");
fs.writeFileSync("deno.import-map.json", importMapJson, "utf8");

console.log("Done.");

/* Helper functions */

function resolveRelativeSpecifier(specifier, file) {
  let resolvedFilePath = path.resolve(path.join(path.dirname(file), specifier));
  if (fs.existsSync(resolvedFilePath) && fs.lstatSync(resolvedFilePath).isDirectory()) {
    resolvedFilePath += "/index";
  }
  specifier = "./" + normalizePathSeparator(path.relative(".", resolvedFilePath));
  return [specifier, specifier + ".ts"];
}

function resolveAliasedSpecifier(specifier) {
  if (specifier === LIB_ALIAS || specifier === LIB_ALIAS_DENO) {
    return [specifier, "./" + LIB_ESM_PATH + specifier.substring(LIB_ALIAS.length) + "/index.js"];
  }
  if (specifier.startsWith(LIB_ALIAS + "/")) {
    return [specifier, "./" + LIB_ESM_PATH + "/" + specifier.substring(LIB_ALIAS.length + 1) + ".js"];
  }
}

function normalizePathSeparator(path) { return path.replace(/\\/g, "/"); }
