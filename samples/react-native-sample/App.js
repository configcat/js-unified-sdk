import React, { useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as configCat from "@configcat/sdk/browser";
import { LogLevel, PollingMode } from "@configcat/sdk/browser";

export default function App() {
  // Setting log level to Info to show detailed feature flag evaluation
  const logger = configCat.createConsoleLogger(LogLevel.Info);
  const configcatClient = configCat.getClient(
    "configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/tiOvFw5gkky9LFu1Duuvzw",
    PollingMode.AutoPoll,
    {
      pollIntervalSeconds: 2,
      logger: logger,
      setupHooks: (hooks) => {
        hooks.on("configChanged", function () {
          console.log("Your config has been changed!");
        });
      },
    },
  );

  return (
    <View style={styles.container}>
      <Text>Is my awesome feature enabled?</Text>
      <Demo client={configcatClient}></Demo>
    </View>
  );
}

function Demo(props) {
  const [awesomeValue, setAwesomeValue] = useState(false);
  props.client.getValueAsync("isAwesomeFeatureEnabled", false).then((value) => {
    setAwesomeValue(value);
  });
  return (
    <View style={styles.demo}>
      <Text style={styles.value}>{awesomeValue ? "yes" : "no"}</Text>
      <Button
        onPress={() => {
          props.client
            .getValueAsync("isAwesomeFeatureEnabled", false)
            .then((value) => {
              setAwesomeValue(value);
            });
        }}
        title={"Check feature flag"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  value: {
    margin: 20,
  },

  demo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
});
