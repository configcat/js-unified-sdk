import * as configcat from "@configcat/sdk/browser";

const logger = configcat.createConsoleLogger(configcat.LogLevel.Info); // Setting log level to Info to show detailed feature flag evaluation

// You can instantiate the client with different polling modes. See the Docs: https://configcat.com/docs/sdk-reference/js/#polling-modes
const configCatClient = configcat.getClient("configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/tiOvFw5gkky9LFu1Duuvzw", configcat.PollingMode.AutoPoll, { pollIntervalSeconds: 2, logger: logger });

onmessage = async (e) => {
  console.log("Feature flag key received from main script");

  const value = await configCatClient.getValueAsync(e.data, false);

  postMessage(value);
  console.log("Feature flag value posted back to main script");
};
