"use strict";

import { LogLevel, PollingMode, User } from "@configcat/sdk/chromium-extension";
import * as configcat from "@configcat/sdk/chromium-extension";

(function() {
  // Setting log level Info to show detailed feature flag evaluation
  const logger = configcat.createConsoleLogger(LogLevel.Info);

  // You can instantiate the client with different polling modes. See the Docs: https://configcat.com/docs/sdk-reference/js/#polling-modes
  const configCatClient = configcat.getClient("configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/tiOvFw5gkky9LFu1Duuvzw", PollingMode.AutoPoll, {
    pollIntervalSeconds: 2,
    logger: logger
  });

  function init() {
    document.getElementById("checkAwesome").addEventListener("click", () => {
      configCatClient.getValueAsync("isAwesomeFeatureEnabled", false).then(value => {
        document.getElementById("isAwesomeEnabled").innerHTML = value;
      });
    });

    document.getElementById("checkProofOfConcept").addEventListener("click", () => {
      const userEmail = document.getElementById("userEmail").value;
      const userObject = new User("#SOME-USER-ID#", userEmail);

      configCatClient.getValueAsync("isPOCFeatureEnabled", false, userObject).then(value => {
        document.getElementById("isPOCEnabled").innerHTML = value;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
