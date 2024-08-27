# ConfigCat SDK for JavaScript
https://configcat.com

ConfigCat SDK for JavaScript provides easy integration for your application to ConfigCat.

## About

Manage features and change your software configuration using <a href="https://configcat.com" target="_blank">ConfigCat feature flags</a>
, without the need to re-deploy code. A <a href="https://app.configcat.com" target="_blank">10 minute trainable Dashboard</a> 
allows even non-technical team members to manage features directly. Deploy anytime, release when confident. 
Target a specific group of users first with new ideas. Supports A/B/n testing and soft launching.

ConfigCat is a <a href="https://configcat.com" target="_blank">hosted feature flag service</a>. Manage feature toggles across frontend, backend, mobile, desktop apps. <a href="https://configcat.com" target="_blank">Alternative to LaunchDarkly</a>. Management app + feature flag SDKs.

[![JS SDK CI](https://github.com/configcat/js-universal-sdk/actions/workflows/js-ci.yml/badge.svg?branch=master)](https://github.com/configcat/js-universal-sdk/actions/workflows/js-ci.yml) 
[![codecov](https://codecov.io/gh/configcat/js-universal-sdk/branch/master/graph/badge.svg)](https://codecov.io/gh/configcat/js-universal-sdk) 
[![Known Vulnerabilities](https://snyk.io/test/github/configcat/js-universal-sdk/badge.svg?targetFile=package.json)](https://snyk.io/test/github/configcat/js-universal-sdk?targetFile=package.json) 
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=configcat_js-universal-sdk&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=configcat_js-universal-sdk) 
[![Tree Shaking](https://badgen.net/bundlephobia/tree-shaking/@configcat/sdk)](https://bundlephobia.com/result?p=@configcat/sdk) 
![License](https://img.shields.io/github/license/configcat/js-universal-sdk.svg) 
[![](https://data.jsdelivr.com/v1/package/npm/@configcat/sdk/badge)](https://www.jsdelivr.com/package/npm/@configcat/sdk)
[![NPM](https://nodei.co/npm/@configcat/sdk.png)](https://nodei.co/npm/@configcat/sdk/)

## Getting Started

### 1. Install and import package:

*via NPM [package](https://npmjs.com/package/@configcat/sdk):*
```PowerShell
npm i @configcat/sdk
```

Node.js backend applications:

```js
import * as configcat from "@configcat/sdk/node";
```

Frontend applications running in the browser:

```js
import * as configcat from "@configcat/sdk/browser";
```

Extensions for Chromium-based browsers (Chrome, Edge, etc.):

```js
import * as configcat from "@configcat/sdk/chromium-extension";
```

> Please note that these package references require your JS runtime or bundler to support the [exports](https://nodejs.org/api/packages.html#exports) package.json field introduced in Node.js v12.7. In the unlikely case of compatibility issues, you can fall back to `import * as configcat from "@configcat/sdk";`. Basically, this is another entry point to the Node.js build, however, if your bundler recognizes the [browser](https://github.com/defunctzombie/package-browser-field-spec) package.json field, it will also work in your browser applications seamlessly.

*via CDN:*

Frontend applications running in the browser

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@configcat/sdk@latest/dist/configcat.browser.umd.min.js"></script>
```

or 

```html
<script type="module">
  import * as configcat from "https://cdn.jsdelivr.net/npm/@configcat/sdk@latest/dist/configcat.browser.esm.min.js";
</script>
```

Extensions for Chromium-based browsers (Chrome, Edge, etc.)

```js
import * as configcat from "https://cdn.jsdelivr.net/npm/@configcat/sdk@latest/dist/configcat.chromium-extension.esm.min.js";
```

### 2. Go to the <a href="https://app.configcat.com/sdkkey" target="_blank">ConfigCat Dashboard</a> to get your *SDK Key*:
![SDK-KEY](https://raw.githubusercontent.com/ConfigCat/js-sdk/master/media/readme02-3.png  "SDK-KEY")

### 3. Create a *ConfigCat* client instance:
```js
const configCatClient = configcat.getClient("#YOUR-SDK-KEY#");
```

> You can acquire singleton client instances for your SDK keys using the `getClient("<sdkKey>")` factory function.
(However, please keep in mind that subsequent calls to `getClient()` with the *same SDK Key* return a *shared* client instance, which was set up by the first call.)

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

## Getting user specific setting values with Targeting

Using this feature, you will be able to get different setting values for different users in your application by passing a `User Object` to `getValueAsync()`.

Read more about [Targeting here](https://configcat.com/docs/advanced/targeting/).

```js
const userObject = new configcat.User("#USER-IDENTIFIER#");
const value = await configCatClient.getValueAsync('isMyAwesomeFeatureEnabled', false, userObject);

if (value) {
  do_the_new_thing();
} else {
  do_the_old_thing();
}
```

## Sample/Demo apps
  - TODO

## Polling Modes

The ConfigCat SDK supports 3 different polling mechanisms to acquire the setting values from ConfigCat. After latest setting values are downloaded, they are stored in the internal cache then all requests are served from there. Read more about Polling Modes and how to use them at [ConfigCat Docs](https://configcat.com/docs/sdk-reference/js/#polling-modes).

## Sensitive information handling

The frontend/mobile SDKs are running in your users' browsers/devices. The SDK is downloading a [config.json](https://configcat.com/docs/requests/) file from ConfigCat's CDN servers. The URL path for this config.json file contains your SDK key, so the SDK key and the content of your config.json file (feature flag keys, feature flag values, targeting rules, % rules) can be visible to your users.

This SDK key is read-only, it only allows downloading your config.json file, but nobody can make any changes with it in your ConfigCat account.  
Suppose you don't want your SDK key or the content of your config.json file visible to your users. In that case, we recommend you use the SDK only in your backend applications and call a backend endpoint in your frontend/mobile application to evaluate the feature flags for a specific application customer.

Also, we recommend using [sensitive targeting comparators](https://configcat.com/docs/advanced/targeting/#sensitive-text-comparators) in the targeting rules of those feature flags that are used in the frontend/mobile SDKs.

## Package content

Currently the `@configcat/sdk` NPM package includes the following builds of the library:
- `dist/configcat.browser.umd.min.js` - for referencing the library in old browsers via HTML script tag:
   - Uses the UMD bundle format.
   - Targets ES5 and includes all required polyfills.
   - TypeScript type definitions are not provided.
* `dist/configcat.browser.esm.min.js` - for referencing the library in newer browsers via HTML script tag:
  - Uses the standard ES module format.
  - Targets ES2015 and includes all required polyfills.
  - TypeScript type definitions are not provided.
* `dist/configcat.chromium-extension.esm.js` - for referencing the library in Chromium-based browser extensions via HTML script tag:
  - Uses the standard ES module format.
  - Targets ES2017 and includes all required polyfills.
  - TypeScript type definitions are not provided.
* `lib/cjs/` - for older versions of Node.js:
  - Uses the legacy Common JS module format.
  - Targets ES2017 and includes all required polyfills except for the `Promise` feature. 
  - TypeScript type definitions are provided.
* `lib/esm/` - for modern versions of Node.js and bundlers:
  - Uses the standard ES modules format.
  - Targets ES2017  and includes all required polyfills except for the `Promise` feature.
  - TypeScript type definitions are provided.

> Please note that the `lib` builds target a relatively new version of the EcmaScript standard. According to [node.green](https://node.green/), this is fully compatible with [the supported Node.js versions](#platform-compatibility). However, if you use a bundler and want to target browsers that have no ES2017 support, please make sure that your bundler is configured to downlevel the language syntax. If you want to go all the way down to ES5, then you will need to include a polyfill for the `Promise` feature as well.

## Platform compatibility

This SDK should be compatible with all modern, widely used JS runtimes (execution engines) and bundlers.

The SDK is [tested](https://github.com/configcat/js-universal-sdk/blob/master/.github/workflows/js-ci.yml) against the following runtimes:
- @configcat/sdk/node:
  - Node.js (v14.x, v16.x, v18.x, v20.x) on Windows / Ubuntu / macOS
- @configcat/sdk/browser:
  - Chrome (stable, latest, beta)
  - Chromium (64.0.3282.0, 72.0.3626.0, 80.0.3987.0)
  - Firefox (latest, latest-beta, 84.0)
- @configcat/sdk/chromium-extension:
  - Chrome (stable, latest, beta)
  - Chromium (72.0.3626.0, 80.0.3987.0)

These tests are running on each pull request, before each deploy, and on a daily basis.

You can view a sample run [here](https://github.com/configcat/js-universal-sdk/actions/runs/TODO).

> We strive to provide an extensive support for the various JS runtimes and build tools. If you still encounter an issue with the SDK on some platform, please open a [GitHub issue](https://github.com/configcat/js-universal-sdk/issues/new/choose) or contact support.

## Need help?
https://configcat.com/support

## Contributing
Contributions are welcome. For more info please read the [Contribution Guideline](CONTRIBUTING.md).

## About ConfigCat
- [Official ConfigCat SDK's for other platforms](https://github.com/configcat)
- [Documentation](https://configcat.com/docs)
- [Blog](https://blog.configcat.com)

## Troubleshooting

### Make sure you have the proper Node.js version installed

You might run into errors caused by the wrong version of Node.js. To make sure you are using the recommended Node.js version follow these steps.

1. Have nvm (Node Version Manager - https://github.com/nvm-sh/nvm ) installed:
1. Run `nvm install`. This will install the compatible version of Node.js.
1. Run `nvm use`. This will use the compatible version of Node.js.
