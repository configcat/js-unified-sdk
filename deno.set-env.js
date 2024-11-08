// This is a workaround for a nasty breaking change introduced in Deno 2:
// the `nodeModulesDir` option must be set to "manual" instead of true.

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const crossEnv = require("cross-env");

(async () => {
  // Detect Deno version.
  const output = await exec('deno --version');
  const match = output.stdout.match(/\bdeno\s+(\d+).(\d+).(\d+)/);
  const major = +match[1];

  // Generate the command line argument specifying the correct option
  // according to Deno version and put it in environment variable.
  process.env["DENO_NODE_MODULES_DIR"] = `--node-modules-dir=${major < 2 ? "true" : "manual"}`;

  // Execute the actual command (with substituting the environment variable).
  crossEnv(process.argv.slice(2), { shell: true });
})();
