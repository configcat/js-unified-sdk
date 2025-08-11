# ConfigCat SDK for JavaScript

[![JS SDK CI](https://github.com/configcat/js-unified-sdk/actions/workflows/js-sdk-ci.yml/badge.svg?branch=master)](https://github.com/configcat/js-unified-sdk/actions/workflows/js-sdk-ci.yml) 
[![Quality Gate Status](https://img.shields.io/sonar/quality_gate/configcat_js-unified-sdk?logo=SonarCloud&server=https%3A%2F%2Fsonarcloud.io)](https://sonarcloud.io/project/overview?id=configcat_js-unified-sdk)
[![SonarCloud Coverage](https://img.shields.io/sonar/coverage/configcat_js-unified-sdk?logo=SonarCloud&server=https%3A%2F%2Fsonarcloud.io)](https://sonarcloud.io/project/overview?id=configcat_js-unified-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/configcat/js-unified-sdk/badge.svg?targetFile=package.json)](https://snyk.io/test/github/configcat/js-unified-sdk?targetFile=package.json) 
![License](https://img.shields.io/github/license/configcat/js-unified-sdk.svg) 
[![](https://data.jsdelivr.com/v1/package/npm/@configcat/sdk/badge)](https://www.jsdelivr.com/package/npm/@configcat/sdk)
[![NPM](https://nodei.co/npm/@configcat/sdk.png)](https://nodei.co/npm/@configcat/sdk/)

ConfigCat SDK for JavaScript provides easy integration for your application to [ConfigCat](https://configcat.com).

This repository hosts the modern ConfigCat SDK for JavaScript platforms. Unlike the legacy platform-specific packages, it provides a single, unified NPM package that supports multiple JS environments.

The new SDK combines and, thus, supersedes these packages:
* [configcat-common](https://www.npmjs.com/package/configcat-common)
* [configcat-js](https://www.npmjs.com/package/configcat-js)
* [configcat-js-ssr](https://www.npmjs.com/package/configcat-js-ssr)
* [configcat-js-chromium-extension](https://www.npmjs.com/package/configcat-js-chromium-extension)
* [configcat-node](https://www.npmjs.com/package/configcat-node)

The new SDK maintains strong backward compatibility, making it a drop-in replacement for the packages listed above. In most cases you just need to replace the old package with the new one and adjust the import specifiers (as shown [here](#1-install-and-import-package)).

## Getting started

### 1. Install and import package:

#### _via NPM_

First install the [NPM package](https://npmjs.com/package/@configcat/sdk):

```PowerShell
npm i @configcat/sdk
```

Then import it into your application:

* Frontend applications and Web Workers running in the browser:
  ```js
  import * as configcat from "@configcat/sdk/browser";
  ```

* Node.js backend applications:
  ```js
  import * as configcat from "@configcat/sdk/node";
  ```

* Deno backend applications:
  ```js
  import * as configcat from "npm:@configcat/sdk/deno";
  ```

  To make this work, you may need to enable the [unstable-byonm](https://deno.com/blog/node-to-deno-challenge#what-are-all-these-unstable-node-compatibility-settings) feature or adjust your [import map](https://docs.deno.com/runtime/fundamentals/modules/#differentiating-between-imports-or-importmap-in-deno.json-and---import-map-option).

* Bun backend applications:
  ```js
  import * as configcat from "@configcat/sdk/bun";
  ```

* Cloudflare Workers:
  ```js
  import * as configcat from "@configcat/sdk/cloudflare-worker";
  ```

* Extensions for Chromium-based browsers (Chrome, Edge, etc.):
  ```js
  import * as configcat from "@configcat/sdk/chromium-extension";
  ```

> [!NOTE]
> Please note that subpath imports require your bundler to support the [exports](https://nodejs.org/api/packages.html#exports) package.json field, introduced in Node.js v12.7. **In the unlikely case of bundler compatibility issues**, you can fall back to importing from the main entry point `@configcat/sdk`. Basically, this is another entry point to the Node.js build, however, if your bundler recognizes the [browser](https://github.com/defunctzombie/package-browser-field-spec) package.json field, it will also work in your browser applications seamlessly.

> [!NOTE]
> For subpath imports to work **in TypeScript**, you must set the [moduleResolution](https://www.typescriptlang.org/tsconfig/#moduleResolution) option to `node16`, `nodenext` or `bundler` in your `tsconfig.json`. For TypeScript versions older than 4.7, where these options are not available, you need to fall back to module resolution `node` and importing from the main entry point `@configcat/sdk`.

#### _via CDN_

Import the package directly from a CDN server into your application:

* Frontend applications and Web Workers running in the browser:

  ```html
  <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@configcat/sdk@latest/dist/configcat.browser.umd.min.js"></script>
  ```

  or 

  ```html
  <script type="module">
    import * as configcat from "https://cdn.jsdelivr.net/npm/@configcat/sdk@latest/dist/configcat.browser.esm.min.js";
  </script>
  ```

* Extensions for Chromium-based browsers (Chrome, Edge, etc.):

  ```js
  <script type="module">
    import * as configcat from "https://cdn.jsdelivr.net/npm/@configcat/sdk@latest/dist/configcat.chromium-extension.esm.min.js";
  </script>
  ```

### 2. Go to the <a href="https://app.configcat.com/sdkkey" target="_blank">ConfigCat Dashboard</a> to get your _SDK Key_:
![SDK-KEY](https://raw.githubusercontent.com/configcat/js-unified-sdk/master/media/readme02-3.png  "SDK-KEY")

### 3. Create a _ConfigCat client_ instance:

```js
const configCatClient = configcat.getClient("#YOUR-SDK-KEY#");
```

> [!NOTE]
> You can acquire singleton client instances for your SDK Keys using the `getClient("<sdkKey>")` factory function.
(However, please keep in mind that subsequent calls to `getClient()` with the _same SDK Key_ return a _shared_ client instance, which was set up by the first call.)

### 4. Get your setting value:

The async/await way:

```js
const value = await configCatClient.getValueAsync('isMyAwesomeFeatureEnabled', false);

if (value) {
  do_the_new_thing();
} else {
  do_the_old_thing();
}
```

or the Promise way:

```js
configCatClient.getValueAsync('isMyAwesomeFeatureEnabled', false)
  .then((value) => {
    if (value) {
      do_the_new_thing();
    } else {
      do_the_old_thing();
    }
  });
```

## Getting user-specific setting values with targeting

This feature allows you to get different setting values for different users in your application by passing a [User Object](https://configcat.com/docs/targeting/user-object/) to `getValueAsync()`.

Read more about targeting [here](https://configcat.com/docs/advanced/targeting/).

```js
const userObject = new configcat.User("#USER-IDENTIFIER#");
const value = await configCatClient.getValueAsync('isMyAwesomeFeatureEnabled', false, userObject);

if (value) {
  do_the_new_thing();
} else {
  do_the_old_thing();
}
```

## Sample/demo apps
  - [Plain HTML + JS](https://github.com/configcat/js-unified-sdk/tree/master/samples/html)
  - [Plain HTML + JS using ECMAScript module system](https://github.com/configcat/js-unified-sdk/tree/master/samples/html-esm)
  - [Plain HTML + TS running the SDK in a Web Worker](https://github.com/configcat/js-unified-sdk/tree/master/samples/web-worker)
  - [Sample Angular web application](https://github.com/configcat/js-unified-sdk/tree/master/samples/angular-sample)
  - [Sample React web application](https://github.com/configcat/js-unified-sdk/tree/master/samples/react-sample)
  - [Sample React Native application](https://github.com/configcat/js-unified-sdk/tree/master/samples/react-native-sample)
  - [Sample Vue SSR web application](https://github.com/configcat/js-unified-sdk/tree/master/samples/vue-ssr-sample)
  - [Sample Node.js console application](https://github.com/configcat/js-unified-sdk/tree/master/samples/node-console)
  - [Sample Node.js console application using ECMAScript module system](https://github.com/configcat/js-unified-sdk/tree/master/samples/node-console-esm)
  - [Sample Node.js console application using TypeScript](https://github.com/configcat/js-unified-sdk/tree/master/samples/ts-node-console)
  - [Sample Node.js console application using TypeScript and ECMAScript module system](https://github.com/configcat/js-unified-sdk/tree/master/samples/ts-node-console-esm)
  - [Sample Node.js application using Express and Docker](https://github.com/configcat/js-unified-sdk/tree/master/samples/node-expresswithdocker)
  - [Sample Node.js application on how to get real time updates on feature flag changes](https://github.com/configcat/js-unified-sdk/tree/master/samples/node-realtimeupdate)
  - [Sample Deno console application](https://github.com/configcat/js-unified-sdk/tree/master/samples/deno-console)
  - [Sample Bun console application](https://github.com/configcat/js-unified-sdk/tree/master/samples/bun-console)
  - [Sample Cloudflare Worker](https://github.com/configcat/js-unified-sdk/tree/master/samples/cloudflare-worker)
  - [Sample Chrome extension](https://github.com/configcat/js-unified-sdk/tree/master/samples/chrome-extension)

## Polling modes

The ConfigCat SDK supports 3 different polling strategies to fetch feature flags and settings from the ConfigCat CDN. Once the latest data is downloaded, it is stored in the cache, then calls to `getValueAsync()` use the cached data to evaluate feature flags and settings. Read more about polling modes and how to use them at [ConfigCat Docs](https://configcat.com/docs/sdk-reference/js/overview/#polling-modes).

## Sensitive information handling

Frontend/mobile SDKs run in your users' browsers/devices. They download a [config JSON](https://configcat.com/docs/requests/) file from ConfigCat's CDN servers. Since the SDK Key is included in the URL path of this file, your users can access both the SDK Key and the contents of the config JSON (including feature flag keys, feature flag values, targeting rules, percentage options, etc.)

However, the SDK Key provides read-only access: it only allows downloading your config JSON file, but it cannot be used to modify the corresponding config in your ConfigCat account.

If you want to prevent your users from accessing your SDK Key and the contents of your config JSON file, we recommend using the SDK in your backend services only. You can then provide a secure API endpoint for your frontend/mobile applications to evaluate feature flags and settings for your users.

Also, we suggest using [confidential text comparators](https://configcat.com/docs/targeting/targeting-rule/user-condition/#confidential-text-comparators) in the targeting rules of the feature flags and settings that are used in frontend/mobile SDKs.

## Package content

Currently the `@configcat/sdk` NPM package includes the following builds of the library:
- `dist/configcat.browser.umd.min.js` - for referencing the library in old browsers via a HTML `<script>` tag:
   - Uses the UMD bundle format.
   - Targets ES5 and includes all required polyfills.
   - TypeScript type definitions are not provided.
* `dist/configcat.browser.esm.min.js` - for referencing the library in newer browsers via a HTML `<script>` tag:
  - Uses the standard ECMAScript module format.
  - Targets ES2015 and includes all required polyfills.
  - TypeScript type definitions are not provided.
* `dist/configcat.chromium-extension.esm.js` - for referencing the library in Chromium-based browser extensions via a HTML `<script>` tag:
  - Uses the standard ECMAScript module format.
  - Targets ES2017 and includes all required polyfills.
  - TypeScript type definitions are not provided.
* `lib/cjs/` - for old versions of Node.js and bundlers not supporting ES modules:
  - Uses the legacy CommonJS module format.
  - Targets ES2017 and includes all required polyfills except for the `Promise` feature.
  - TypeScript type definitions are provided.
* `lib/esm/` - for modern versions of Node.js, Deno, Bun and bundlers:
  - Uses the standard ECMAScript module format.
  - Targets ES2017 and includes all required polyfills except for the `Promise` feature.
  - TypeScript type definitions are provided.

> [!NOTE]
> Please note that the `lib` builds target a relatively new version of the ECMAScript standard. According to [node.green](https://node.green/), this is fully compatible with [the supported Node.js versions](#platform-compatibility). However, if you use a bundler and want to target browsers that have no ES2017 support, please make sure that your bundler is configured to downlevel the language syntax. If you want to go all the way down to ES5, then you will need to include a polyfill for the `Promise` feature as well.

## Platform compatibility

This SDK should be compatible with all modern, widely used JS runtimes (execution engines) and bundlers.

The SDK is [tested](https://github.com/configcat/js-unified-sdk/blob/master/.github/workflows/js-sdk-ci.yml) against the following runtimes:
- @configcat/sdk/browser:
  - Chrome (stable, latest, beta)
  - Chromium (71.0.3556.0, 72.0.3626.0, 80.0.3987.0)
  - Firefox (84.0, latest, latest-beta)
  - Safari (latest)
- @configcat/sdk/bun:
  - Bun (v1.1.0, latest stable) on Windows / Ubuntu / macOS
- @configcat/sdk/deno:
  - Deno (v1.31, v1.46, latest stable) on Windows / Ubuntu / macOS
- @configcat/sdk/node:
  - Node.js (v14.x, v16.x, v18.x, v20.x, v22.x) on Windows / Ubuntu / macOS
- @configcat/sdk/cloudflare-worker:
  - Workerd (2023-02-28)
- @configcat/sdk/chromium-extension:
  - Chrome (stable, latest, beta)
  - Chromium (72.0.3626.0, 80.0.3987.0)

The SDK is compatible with TypeScript v4.0.2 or newer. Earlier versions may work but those are not tested, thus, not supported officially.

These tests are running on each pull request, before each deploy, and on a daily basis.

You can view a sample run [here](https://github.com/configcat/js-unified-sdk/actions/runs/16875243620).

> [!NOTE]
> We strive to provide an extensive support for the various JS runtimes and build tools. If you still encounter an issue with the SDK on some platform, please open a [GitHub issue](https://github.com/configcat/js-unified-sdk/issues/new/choose) or [contact support](https://configcat.com/support).

## Troubleshooting

### Make sure you have the proper Node.js version installed

You might run into errors caused by the wrong version of Node.js. To make sure you are using the recommended Node.js version follow these steps.

1. Have nvm (Node Version Manager - https://github.com/nvm-sh/nvm ) installed:
1. Run `nvm install`. This will install the compatible version of Node.js.
1. Run `nvm use`. This will use the compatible version of Node.js.

## Need help?
https://configcat.com/support

## Contributing
Contributions are welcome. For more info please read the [Contribution Guideline](CONTRIBUTING.md).

## About ConfigCat

ConfigCat is a feature flag and configuration management service that lets you separate releases from deployments. You can turn your features ON/OFF using <a href="https://app.configcat.com" target="_blank">ConfigCat Dashboard</a> even after they are deployed. ConfigCat lets you target specific groups of users based on region, email or any other custom user attribute.

ConfigCat is a <a href="https://configcat.com" target="_blank">hosted feature flag service</a>. Manage feature toggles across frontend, backend, mobile, desktop apps. <a href="https://configcat.com" target="_blank">Alternative to LaunchDarkly</a>. Management app + feature flag SDKs.

- [Official ConfigCat SDKs for other platforms](https://github.com/configcat#-official-open-source-sdks)
- [Documentation](https://configcat.com/docs)
- [Blog](https://configcat.com/blog)
