const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  mode: "production",
  entry: path.resolve("test/cloudflare-worker/index.ts"),
  output: {
    path: path.resolve("test/cloudflare-worker/dist"),
    filename: "worker.js",
    library: {
      type: "module",
    },
  },
  experiments: {
    outputModule: true,
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],
    plugins: [new TsconfigPathsPlugin({
      configFile: "tsconfig.workerd.cloudflare-worker.json",
    })],
    fallback: {
      "stream": false,
      "util": false,
    },
  },
  devtool: "source-map",
  optimization: {
    splitChunks: false,
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /\.tsx?$/,
        use: [{
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.workerd.cloudflare-worker.json",
          },
        }],
      },
    ],
  },
};
