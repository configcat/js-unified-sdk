import { LogLevel, OverrideBehaviour, PollingMode, User, createConsoleLogger, createFlagOverridesFromQueryParams, getClient } from "@configcat/sdk/cloudflare-worker";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    // Creating the ConfigCat client instance using the SDK Key
    const client = getClient(
      "PKDVCLf-Hq-h-kCzMp-L7Q/HhOWfwVtZ0mb30i9wi17GQ",
      // For short-lived workers it is recommended to use Lazy Loading mode
      PollingMode.LazyLoad,
      {
        // Setting cache TTL (specify a reasonable value in your application)
        cacheTimeToLiveSeconds: 10,
        // Setting log level to Info to show detailed feature flag evaluation
        logger: createConsoleLogger(LogLevel.Info),
        // Uncomment the next line to enable flag overriding using the query string parameters of the request
        // flagOverrides: createFlagOverridesFromQueryParams(OverrideBehaviour.LocalOverRemote, request)
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

      return await Promise.resolve(new Response(`isPOCFeatureEnabled: ${value}`));
    }
    finally {
      client.dispose();
    }
  },
} satisfies ExportedHandler<Env>;
