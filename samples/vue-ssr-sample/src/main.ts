import { createSSRApp } from 'vue'
import App from './App.vue'
import type { IConfigCatClient } from '@configcat/sdk';

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp(isSSR: boolean, configCatClient: IConfigCatClient) {
  const app = createSSRApp(App)
  app.provide("isSSR", isSSR);
  app.provide("configCatClient", configCatClient);
  return { app }
}
