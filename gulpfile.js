"use strict";

/*

This is the project's build script. It's a plain Node.js program that uses Gulp to orchestrate the build process.
(In case you need to dig into it deeper, a VS Code debug configuration named "Debug build" is available.)

The TARGETS array below specifies the build outputs (or "builds" for short). We have two types of builds:
- lib - separate module files for bundlers and runtimes like Node.js
- dist - pre-bundled script files that can be imported in browsers directly

The build process is very simple, consisting of the following tasks:
1. clean - removes previous build artifacts if any
2. compile - runs tsc for an item of TARGETS with the specified tsconfig
3. postProcess - makes adjustments to the output of compile

The following post-processing steps are performed:
- Adjust .d.ts files of the CJS build - According to our tests, the best compatibility with various build tools can
  be achieved when each source file has the corresponding .d.ts file in the same directory. However, we don't want to
  duplicate the type declarations because that could lead to other subtle issues, so we replace the content of the CJS
  build's .d.ts files so they just re-export the type declarations from the corresponding files of the ESM build.

- Ensure declaration of platform-specific types used in the public API - Platform-specific types are problematic when
  they appear in the public API (e.g. http.Agent in INodeHttpConfigFetcherOptions) because they cause compile errors in
  the consumer project unless they are available there - which, in some cases, requires external typing packages like
  @types/node to be installed. However, since this is a multi-platform package, we don't want to add dependencies to
  platform-specific typing packages. So, as a workaround, we declare shims for the necessary types and reference it in
  the relevant .d.ts files using a triple-slash directive. (See also: https://github.com/microsoft/TypeScript/issues/31894)

- Fix extensions of referenced files in export/import statements - Most runtimes require explicit file extensions in
  import statements, so we adjust the import paths to include the .js extension.

- Strip const from enums to provide normal enums to consumers - We use const enums internally to reduce bundle size but
  also want to preserve enum mappings for consumers. Therefore, we enable "preserveConstEnums" in tsconfig, but that's
  not enough on its own: we also need to strip const from enum declarations in .d.ts files.

- Add package.json to the ESM build - Since the package type is commonjs, we need to create another package.json file
  with "type": "module" in the lib/esm directory, otherwise modules with .js extension won't be recognized as ES modules
  by Node.js.

- Inject package version - We need to replace the "CONFIGCAT_SDK_VERSION" magic string with the actual version string
  specified in the package.json.

*/

const child_process = require("child_process");
const fs = require("fs"), fsp = fs.promises;
const glob = require("glob");
const gulp = require("gulp");
const path = require("path");
const packageJson = require("./package.json");

process.chdir(__dirname);

/* Build properties */

const SRC_PATH = "src";
const LIB_PATH = "lib";
const DIST_PATH = "dist";

const TARGETS = [
  { id: "cjs", outDir: path.join(LIB_PATH, "cjs"), compileArgs: { config: "tsconfig.build.cjs.json" }, postProcessArgs: { importExtension: ".js", reexportTypesFrom: "../esm" } },
  { id: "esm", outDir: path.join(LIB_PATH, "esm"), compileArgs: { config: "tsconfig.build.esm.json" }, postProcessArgs: { importExtension: ".js", skipTypes: true, addModulePackageJson: true } },
  { id: "types", outDir: path.join(LIB_PATH, "esm"), compileArgs: { config: "tsconfig.build.types.json" }, postProcessArgs: { importExtension: ".js", skipVersionUpdate: true } },
  { id: "esm-browser-bundle", outFile: path.join(DIST_PATH, "configcat.browser.esm.js"), compileArgs: { useWebpack: true, config: "webpack.browser.esm.config.js" } },
  { id: "umd-browser-bundle", outFile: path.join(DIST_PATH, "configcat.browser.umd.js"), compileArgs: { useWebpack: true, config: "webpack.browser.umd.config.js" } },
  { id: "esm-chromium-extension-bundle", outFile: path.join(DIST_PATH, "configcat.chromium-extension.esm.js"), compileArgs: { useWebpack: true, config: "webpack.chromium-extension.esm.config.js" } },
];

/* Build tasks */

async function clean() {
  for (const path of [LIB_PATH, DIST_PATH]) {
    if (fs.existsSync(path)) {
      await fsp.rm(path, { recursive: true });
    }
  }
}

function compile(targetId, { useWebpack, config }, buildForPublish) {
  console.log(`* Compiling target '${targetId}'...`);
  return new Promise((resolve, reject) => {
    const [command, args] = useWebpack
      ? ["node_modules/.bin/webpack", ["-c", path.normalize(config)]]
      : ["node_modules/.bin/tsc", ["-p", path.normalize(config), "--sourceMap", !buildForPublish]];

    const childProcess = child_process.spawn(path.normalize(command), args, { shell: true });
    childProcess.stdout.on("data", data => console.log(data.toString()));
    childProcess.stderr.on("data", data => console.error(data.toString()));
    childProcess.on("close", code => !code ? resolve() : reject(Error(`tsc exited with code ${code}`)));
    childProcess.on("error", err => reject(err));
  });
}

async function postProcess(targetId, targetFile, targetDir, { importExtension, reexportTypesFrom, skipTypes, addModulePackageJson, skipVersionUpdate }, version) {
  console.log(`* Post-processing target '${targetId}'...`);

  let filesToCopy = {};

  if (targetDir != null && (importExtension || reexportTypesFrom != null)) {
    const importDir = reexportTypesFrom != null ? path.resolve(targetDir, reexportTypesFrom) : null;
    for await (const file of glob.globIterate(normalizePathSeparator(targetDir) + "/**", { absolute: true })) {
      const isDts = file.endsWith(".d.ts");
      if (isDts) {
        if (skipTypes) continue;

        if (reexportTypesFrom != null) {
          // Adjust .d.ts files of the CJS build
          const importDirRelative = path.relative(path.dirname(file), importDir);
          let importFile = path.join(importDirRelative, path.relative(targetDir, file));
          importFile = changeExtension(changeExtension(importFile, ""), importExtension ?? "");
          const fileContent = `export * from "${normalizePathSeparator(importFile)}";`;
          await fsp.writeFile(file, fileContent, "utf8", { flush: true });
          continue;
        } else {
          // Strip const from enums to provide normal enums to consumers
          let fileContent = await fsp.readFile(file, "utf8");
          fileContent = fileContent.replace(/declare\s+const\s+enum/g, () => {
            return "declare enum";
          });

          // Ensure declaration of platform-specific types used in the public API
          const relativeFilePath = normalizePathSeparator(path.relative(targetDir, file));
          switch (relativeFilePath) {
            case "browser/index.main.d.ts":
            case "bun/index.d.ts":
            case "node/index.d.ts":
              filesToCopy[path.join(SRC_PATH, "node", "shims.d.ts")] = path.join(targetDir, "node", "shims.d.ts");
              fileContent = '/// <reference path="../node/shims.d.ts" />\n' + fileContent;
              break;
          }

          await fsp.writeFile(file, fileContent, "utf8", { flush: true });

          if (importExtension == null) {
            continue;
          }
        }
      } else if (importExtension == null || !file.endsWith(importExtension)) {
        continue;
      }

      // Fix extensions of referenced files in export/import statements
      let fileContent = await fsp.readFile(file, "utf8");
      const isEsm = addModulePackageJson || isDts;
      fileContent = (isEsm ? fixEsmImports : fixCjsImports)(path.dirname(file), fileContent, importExtension);
      if (fileContent != null) await fsp.writeFile(file, fileContent, "utf8", { flush: true });
    }
  }

  const outputPath = targetFile ?? targetDir;

  for (const [src, dest] of Object.entries(filesToCopy)) {
    const fileContent = await fsp.readFile(src, "utf8");
    await fsp.writeFile(dest, normalizeLineEndings(fileContent), "utf8", { flush: true });
  }

  // Add package.json to the ESM build
  if (addModulePackageJson) {
    await fsp.writeFile(path.join(outputPath, "package.json"), '{ "type": "module", "sideEffects": false }', { flush: true });
  }

  // Inject package version
  if (!skipVersionUpdate) {
    const versionFilePaths = targetFile != null
      ? [targetFile, changeExtension(targetFile, ".min" + path.extname(targetFile))]
      : [path.join(targetDir, "Version.js")];

    for (const file of versionFilePaths) {
      if (fs.existsSync(file)) {
        let fileContent = await fsp.readFile(file, "utf8");
        fileContent = fileContent.replace("CONFIGCAT_SDK_VERSION", version);
        await fsp.writeFile(file, fileContent, "utf8", { flush: true });
      }
    }
  }

  /* Helper functions */

  function normalizeLineEndings(text) { return text.replace(/\r?\n|\r/g, "\n"); }

  function normalizePathSeparator(path) { return path.replace(/\\/g, "/"); }

  function changeExtension(file, ext) {
    return path.join(path.dirname(file), path.basename(file, path.extname(file)) + ext);
  }

  function fixCjsImports(baseDir, fileContent, ext) {
    return fixImports(baseDir, fileContent, ext, /((?:^|[^\w$_])require\s*\(\s*)('|")(\..*?)\2(\s*\))/g);
  }

  function fixEsmImports(baseDir, fileContent, ext) {
    return fixImports(baseDir, fileContent, ext, /(import|from\s*)('|")(\..*?)\2()/g);
  }

  function fixImports(baseDir, fileContent, ext, regex) {
    let changed = false;
    fileContent = fileContent.replace(regex, (_, pre, quote, specifier, post) => {
      changed = true;
      const filePath = path.resolve(path.join(baseDir, specifier));
      if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
        specifier += "/index";
      }
      return pre + quote + specifier + ext + quote + post;
    });
    return changed ? fileContent : null;
  }
}

/* Build pipeline configuration */

const args = process.argv.slice(2);
const buildForPublish = args.some(arg => arg == "--for-publish");

exports.default = gulp.series(
  clean,
  gulp.parallel(TARGETS.map(({ id, compileArgs }) => compile.bind(global, id, compileArgs ?? {}, buildForPublish))),
  gulp.parallel(TARGETS.map(({ id, outFile, outDir, postProcessArgs }) => postProcess.bind(global, id, outFile, outDir, postProcessArgs ?? {}, packageJson.version)))
);
