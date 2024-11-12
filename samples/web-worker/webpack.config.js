export default {
  mode: "production",
  entry: {
    "main": "./src/index.ts",
    "worker": "./src/worker.ts"
  },
  output: {
    filename: "[name].js",
    library: { type: "umd" },
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /.ts$/,
        use: [{
          loader: "ts-loader"
        }]
      }
    ]
  },
  devtool: "source-map"
};
