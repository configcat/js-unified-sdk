const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = new function(options) {
  options = options || {};

  return Object.assign(this, {
    mode: "production",
    resolve: {
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: [".ts", ".tsx", ".js"],
      plugins: [new TsconfigPathsPlugin({
        configFile: "tsconfig.karma.browser.json",
      })],
    },
    devtool: "inline-source-map",
    optimization: {
      // This is a workaround necessary because source maps are broken by default in karma-webpack 5.0.0
      // (see https://github.com/ryanclark/karma-webpack/issues/493#issuecomment-780411348)
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
              configFile: "tsconfig.karma.browser.json",
            },
          }],
        },
        ...(options.enableCoverage
          ? [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "coverage-istanbul-loader",
            enforce: "post",
            options: {
              esModules: true,
            },
          }]
          : []
        ),
        // Some test dependencies may use modern ES features which are not supported
        // by all the targets defined in our CI workflow.
        // So these dependencies must be downleveled to not break the checks.
        // (@babel/preset-env transpiles to ES5 by default.)
        {
          test: /\.m?js$/,
          include: [
            path.resolve("node_modules/fetch-mock"),
            path.resolve("node_modules/mock-xmlhttprequest"),
          ],
          use: [{
            loader: "babel-loader",
            options: {
              "presets": ["@babel/preset-env"],
            },
          }],
        },
      ],
    },
  });
}();
