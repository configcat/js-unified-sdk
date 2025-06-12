import type { OptionsBase } from "../ConfigCatClientOptions";
import type { IConfigCatConfigFetcher } from "../ConfigFetcher";
import { FetchApiConfigFetcher } from "../shared/FetchApiConfigFetcher";

/// @ts-expect-error The `getFactory` static method is intentionally shadowed.
export class DenoHttpConfigFetcher extends FetchApiConfigFetcher {
  private static getFactory(): (options: OptionsBase) => IConfigCatConfigFetcher {
    return options => {
      const configFetcher = new DenoHttpConfigFetcher();
      configFetcher["logger"] = options.logger;
      return configFetcher;
    };
  }

  protected override runsOnServerSide = true;
}
