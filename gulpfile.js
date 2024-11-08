"use strict";

const gulp = require("gulp");
const child_process = require("child_process");
const path = require("path");
const fs = require("fs"), fsp = fs.promises;
const glob = require("glob");
const packageJson = require("./package.json");

process.chdir(__dirname);

/* Build properties */

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

function compile(targetId, { useWebpack, config }) {
  console.log(`* Compiling target '${targetId}'...`);
  return new Promise((resolve, reject) => {
    const [command, args] = useWebpack
      ? ["node_modules/.bin/webpack", ["-c", path.normalize(config)]]
      : ["node_modules/.bin/tsc", ["-p", path.normalize(config)]];

    const childProcess = child_process.spawn(path.normalize(command), args, { shell: true });
    childProcess.stdout.on("data", data => console.log(data.toString()));
    childProcess.stderr.on("data", data => console.error(data.toString()));
    childProcess.on("close", code => !code ? resolve() : reject(Error(`tsc exited with code ${code}`)));
    childProcess.on("error", err => reject(err));
  });
}

async function postProcess(targetId, targetFile, targetDir, { importExtension, reexportTypesFrom, skipTypes, addModulePackageJson, skipVersionUpdate }, version) {
  console.log(`* Post-processing target '${targetId}'...`);

  if (targetDir != null && (importExtension || reexportTypesFrom != null)) {
    const importDir = reexportTypesFrom != null ? path.resolve(targetDir, reexportTypesFrom) : null;
    for await (const file of glob.globIterate(normalizePathSeparator(targetDir) + "/**", { absolute: true })) {
      const isDts = file.endsWith(".d.ts");
      if (isDts) {
        if (skipTypes) continue;

        if (reexportTypesFrom != null) {
          // According to our tests, the best compatibility with various build tools can be achieved when each source file has
          // the corresponding .d.ts file in the same directory. However, we don't want to duplicate the type definitions
          // (because that could lead to other subtle issues), so we replace the content of the CJS build's .d.ts files so
          // they just reexport the type definitions from the corresponding files of the ESM build.
          const importDirRelative = path.relative(path.dirname(file), importDir);
          let importFile = path.join(importDirRelative, path.relative(targetDir, file));
          importFile = changeExtension(changeExtension(importFile, ""), importExtension ?? "");
          const fileContent = `export * from "${normalizePathSeparator(importFile)}";`;
          await fsp.writeFile(file, fileContent, "utf8", { flush: true });
          continue;
        }
        else {
          // Strip const from enums to provide normal enums to consumers.
          let fileContent = await fsp.readFile(file, "utf8");
          fileContent = fileContent.replace(/declare\s+const\s+enum/g, () => {
            return "declare enum";
          });
          await fsp.writeFile(file, fileContent, "utf8", { flush: true });

          if (importExtension == null) {
            continue;
          }
        }
      }
      else if (importExtension == null || !file.endsWith(importExtension)) {
        continue;
      }

      // Fix extensions of referenced files in export/import statements.
      let fileContent = await fsp.readFile(file, "utf8");
      const isEsm = addModulePackageJson || isDts;
      fileContent = (isEsm ? fixEsmImports : fixCjsImports)(targetDir, fileContent, importExtension);
      if (fileContent != null) await fsp.writeFile(file, fileContent, "utf8", { flush: true });
    }
  }

  const outputPath = targetFile ?? targetDir;

  // As the package type is commonjs, we need to add another package json to the directory containing the ES module files,
  // otherwise the .js extension won't work for them.
  if (addModulePackageJson) {
    await fsp.writeFile(path.join(outputPath, "package.json"), '{ "type": "module", "sideEffects": false }', { flush: true });
  }

  // We need to replace the "CONFIGCAT_SDK_VERSION" magic string with the actual version string specified in the package.json.
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

exports.default = gulp.series(
  clean,
  gulp.parallel(TARGETS.map(({ id, compileArgs }) => compile.bind(global, id, compileArgs ?? {}))),
  gulp.parallel(TARGETS.map(({ id, outFile, outDir, postProcessArgs }) => postProcess.bind(global, id, outFile, outDir, postProcessArgs ?? {}, packageJson.version)))
);
