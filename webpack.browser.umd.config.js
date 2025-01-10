const target = "ES5";

const entryPoints = [
  "core-js/features/promise",
  "./src/browser/index.ts",
];

module.exports = {
  mode: "production",
  entry: {
    "configcat.browser.umd": entryPoints,
    "configcat.browser.umd.min": entryPoints,
  },
  optimization: {
    minimize: true,
    minimizer: [new (require("terser-webpack-plugin"))({
      include: /\.min\.js$/,
    })],
  },
  output: {
    filename: "[name].js",
    library: { name: "configcat", type: "umd", umdNamedDefine: true },
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /.tsx?$/,
        use: [{
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.build.esm.json",
            compilerOptions: {
              target,
              importHelpers: true,
              declaration: false,
            },
          },
        }],
      },
    ],
  },
};
