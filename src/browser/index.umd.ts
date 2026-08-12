import type { ObjectMap } from "../Utils";
import { createMap } from "../Utils";
import type { ClientCacheState, IConfigCatClient, IConfigCatClientSnapshot, IJSAutoPollOptions } from ".";
import { getClient, PollingMode } from ".";

export * from ".";

/* Support for Google Tag Manager */

export let $clients: ObjectMap<string, IConfigCatClient> | undefined;
export let $snapshots: ObjectMap<string, IConfigCatClientSnapshot> | undefined;

export function $pollConfig(
  sdkKey: string,
  options: IJSAutoPollOptions,
  onConfigChanged: (sdkKey: string, cacheState: ClientCacheState) => boolean
): void {
  let client: IConfigCatClient | undefined;

  function configChangedHandler() {
    const snapshot = client!.snapshot();
    ($snapshots ??= createMap())[sdkKey] = snapshot;

    const continuePolling = onConfigChanged(sdkKey, snapshot.cacheState);
    if (!continuePolling) {
      client!.dispose(); // this also disconnects all event handlers
      client = void 0; // the object is not needed anymore, let GC collect it
      delete $clients![sdkKey];
    }
    return continuePolling;
  }

  client = getClient(sdkKey, PollingMode.AutoPoll, options);

  // NOTE: We need to keep a strong reference to the client instance, otherwise it may be garbage collected.
  // (Hooks only stores a weak reference to it.)
  ($clients ??= createMap())[sdkKey] = client;

  client.waitForReady().then(() => {
    if (configChangedHandler()) {
      client!.on("configChanged", configChangedHandler);
    }
  });
}
