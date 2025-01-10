import { createConsoleLogger, getClient, LogLevel, PollingMode, User } from "@configcat/sdk/bun";

// Creating the ConfigCat client instance using the SDK Key
const client = getClient(
  "configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/tiOvFw5gkky9LFu1Duuvzw",
  PollingMode.AutoPoll,
  {
    // Setting log level to Info to show detailed feature flag evaluation
    logger: createConsoleLogger(LogLevel.Info),
    setupHooks: hooks => hooks
      .on("clientReady", () => console.log("Client is ready!"))
  });

try {
  // Creating a user object to identify the user (optional)
  const user = new User("<SOME USERID>");
  user.country = "US";
  user.email = "configcat@example.com";
  user.custom = {
    "subscriptionType": "Pro",
    "role": "Admin",
    "version": "1.0.0"
  };

  // Accessing feature flag or setting value
  const value = await client.getValueAsync("isPOCFeatureEnabled", false, user);
  console.log(`isPOCFeatureEnabled: ${value}`);
} finally {
  client.dispose();
}