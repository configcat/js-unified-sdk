// TypeScript versions earlier than v4.7 does not support module resolution modes "Node16" / "NodeNext",
// which is necessary for package.json export subpaths to work. This means that when using the legacy
// "Node" module resolution mode, importing the SDK via the "@configcat/sdk/node" specifier won't work.
// In such cases, you can resort to importing the SDK using the "@configcat/sdk" specifier.
import * as configcat from "@configcat/sdk";

(async () => {
  const logger = configcat.createConsoleLogger(configcat.LogLevel.Info); // Setting log level to Info to show detailed feature flag evaluation

  // You can instantiate the client with different polling modes. See the Docs: https://configcat.com/docs/sdk-reference/js/#polling-modes
  const configCatClient = configcat.getClient("PKDVCLf-Hq-h-kCzMp-L7Q/HhOWfwVtZ0mb30i9wi17GQ", configcat.PollingMode.AutoPoll, { pollIntervalSeconds: 2, logger: logger });

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
