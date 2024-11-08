const target = "ES2017";

const entryPoints = [
  "./src/chromium-extension/index.ts"
];

module.exports = {
  mode: "production",
  entry: {
    "configcat.chromium-extension.esm": entryPoints,
    "configcat.chromium-extension.esm.min": entryPoints,
  },
  optimization: {
    minimize: true,
    minimizer: [new (require("terser-webpack-plugin"))({
      include: /\.min\.js$/
    })]
  },
  output: {
    filename: "[name].js",
    library: { type: "module" },
  },
  experiments: {
    outputModule: true
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
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
              declaration: false
            }
          }
        }]
      }
    ]
  }
};
