import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.js",
  output: {
    file: "dist/main.js",
    format: "umd"
  },
  plugins: [nodeResolve({ browser: true })] // https://github.com/rollup/plugins/pull/866 
};