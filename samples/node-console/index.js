const configcat = require("@configcat/sdk/node");

(async () => {
  const logger = configcat.createConsoleLogger(configcat.LogLevel.Info); // Setting log level to Info to show detailed feature flag evaluation

  // You can instantiate the client with different polling modes. See the Docs: https://configcat.com/docs/sdk-reference/js/#polling-modes
  const configCatClient = configcat.getClient("configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/tiOvFw5gkky9LFu1Duuvzw", configcat.PollingMode.AutoPoll, { pollIntervalSeconds: 2, logger: logger });

  const value = await configCatClient.getValueAsync("isAwesomeFeatureEnabled", false);
  console.log("isAwesomeFeatureEnabled: " + value);

  // Read more about the User Object: https://configcat.com/docs/sdk-reference/js/#user-object
  const userObject = new configcat.User("#SOME-USER-ID#", "configcat@example.com");

  const value2 = await configCatClient.getValueAsync("isPOCFeatureEnabled", false, userObject);
  console.log("isPOCFeatureEnabled: " + value2);

  configCatClient.dispose();
})().catch(err => {
  // You must handle async exceptions since nothing else is going to (see https://stackoverflow.com/a/46515787/8656352).
  console.error("Unhandled exception:", err);
});
