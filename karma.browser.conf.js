const enableCoverage = process.env.TEST_BROWSER_COVERAGE?.toLowerCase() === "true";

module.exports = function(config) {
  config.set({
    frameworks: ["mocha", "chai", "webpack"],

    client: {
      mocha: {
        timeout: 30000,
      },
    },

    files: [
      { pattern: "test/browser/index.ts", watched: false },
      { pattern: "test/data/**", included: false, watched: false, served: true },
    ],

    preprocessors: {
      ["test/**/*.ts"]: ["webpack", "sourcemap"],
      ["lib/esm/**/*.js"]: ["sourcemap"],
    },

    mime: {
      "text/x-typescript": ["ts", "tsx"],
    },

    webpack: new require("./webpack.karma.browser.config.js").constructor({ enableCoverage }),
    webpackMiddleware: {
      noInfo: true,
    },

    client: {
      mocha: {
        timeout: 30000,
      },
    },

    reporters: [
      "progress",
      ...(enableCoverage ? ["coverage-istanbul"] : []),
    ],

    ...(enableCoverage
      ? {
        coverageIstanbulReporter: {
          reports: ["text-summary", "lcov"],
          dir: "coverage/browser",
          skipFilesWithNoCoverage: true,
        },
      }
      : {}
    ),

    singleRun: true,
  });
};
