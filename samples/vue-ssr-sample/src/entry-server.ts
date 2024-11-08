import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'
import * as configcat from "@configcat/sdk/node";

const logger = configcat.createConsoleLogger(configcat.LogLevel.Info); // Setting log level to Info to show detailed feature flag evaluation

const configCatClient = configcat.getClient("PKDVCLf-Hq-h-kCzMp-L7Q/HhOWfwVtZ0mb30i9wi17GQ", configcat.PollingMode.AutoPoll, { pollIntervalSeconds: 2, logger: logger });
// You can instantiate the client with different polling modes. See the Docs: https://configcat.com/docs/sdk-reference/js/#polling-modes

export async function render() { 
  await configCatClient.waitForReady();

  const { app } = createApp(true, configCatClient);

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = {}
  const html = await renderToString(app, ctx)

  return { html }
}
