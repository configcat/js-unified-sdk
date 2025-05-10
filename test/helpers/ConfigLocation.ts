import { createManualPollOptions } from "./fakes";
import { AugmentedOptions, platform } from "./platform";
import { DataGovernance, IOptions, ManualPollOptions } from "#lib/ConfigCatClientOptions";
import { ManualPollConfigService } from "#lib/ManualPollConfigService";
import { Config } from "#lib/ProjectConfig";

const configCache: { [location: string]: Promise<Config> } = {};

export abstract class ConfigLocation {
  abstract getRealLocation(): string;

  abstract fetchConfigAsync(): Promise<Config>;

  fetchConfigCachedAsync(): Promise<Config> {
    const location = this.getRealLocation();
    let configPromise = configCache[location];
    if (!configPromise) {
      configCache[location] = configPromise = this.fetchConfigAsync();
    }
    return configPromise;
  }

  abstract toString(): string;
}

export class CdnConfigLocation extends ConfigLocation {
  static getDefaultCdnUrl(options?: IOptions): string {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (options?.dataGovernance ?? DataGovernance.Global) {
      case DataGovernance.EuOnly:
        return "https://cdn-eu.configcat.com";
      default:
        return "https://cdn-global.configcat.com";
    }
  }

  private $options?: AugmentedOptions<ManualPollOptions>;
  get options(): AugmentedOptions<ManualPollOptions> {
    return this.$options ??= createManualPollOptions(this.sdkKey, {
      baseUrl: this.baseUrl ?? CdnConfigLocation.getDefaultCdnUrl(),
    });
  }

  constructor(
    readonly sdkKey: string,
    readonly baseUrl?: string
  ) {
    super();
  }

  getRealLocation(): string {
    const url = this.options.getRealUrl();
    const index = url.lastIndexOf("?");
    return index >= 0 ? url.slice(0, index) : url;
  }

  async fetchConfigAsync(): Promise<Config> {
    const configService = new ManualPollConfigService(this.options);

    const [fetchResult, projectConfig] = await configService.refreshConfigAsync();
    if (!fetchResult.isSuccess) {
      throw new Error("Could not fetch config from CDN: " + fetchResult.errorMessage);
    }
    return projectConfig.config!;
  }

  toString(): string {
    return this.sdkKey + (this.baseUrl ? ` (${this.baseUrl})` : "");
  }
}

export class LocalFileConfigLocation extends ConfigLocation {
  filePath: string;

  constructor(...paths: ReadonlyArray<string>) {
    super();
    this.filePath = platform().pathJoin(...paths);
  }

  getRealLocation(): string { return this.filePath; }

  async fetchConfigAsync(): Promise<Config> {
    const configJson = await platform().readFileUtf8(this.filePath);
    const parsedObject = JSON.parse(configJson);
    return new Config(parsedObject);
  }

  toString(): string {
    return this.getRealLocation();
  }
}
