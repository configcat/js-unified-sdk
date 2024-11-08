const base = require("./karma.browser.conf.js");

module.exports = function(config) {
  base(config);
  config.set({
    browsers: ["ChromiumHeadless"],
  });
};
