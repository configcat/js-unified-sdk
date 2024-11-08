const base = require("./karma.chromium-extension.conf.js");

module.exports = function(config) {
  base(config);
  config.set({
    browsers: ["ChromiumHeadless"],
  });
};
