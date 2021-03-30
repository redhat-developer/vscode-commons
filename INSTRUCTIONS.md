## Add "redhat.vscode-commons" as extension dependency in package.json

Start by adding `redhat.vscode-commons` to the `extensionDependencies` section of your extension's package.json, so that dependency can be automatically downloaded and installed, when installing your extension from the Marketplace.

```
  "extensionDependencies": ["redhat.vscode-commons"],
```

## Add the "@redhat-developer/vscode-redhat-telemetry" dependency

You need to install `@redhat-developer/vscode-redhat-telemetry`, a thin wrapper for `redhat.vscode-commons`'s API. Open a terminal and execute:

```
npm i @redhat-developer/vscode-redhat-telemetry
```


## [Optional] Add a custom segment key in package.json file
By default, extensions will send their data to https://app.segment.com/redhat-devtools/sources/vscode/. In development mode, the data is sent to https://app.segment.com/redhat-devtools/sources/vs_code_tests/.

- You can specify custom segment keys to connect and push usage data to https://segment.com/

```
    "segmentWriteKey": "your-segment-key-goes-here",
    "segmentWriteKeyDebug": "your-segment-key-goes-here-for-dev-mode",
```

## Add the below code in your client's extension.ts

```typescript
import { getTelemetryService, TelemetryService } from "@redhat-developer/vscode-redhat-telemetry";
...
const telemetryService: TelemetryService = await getTelemetryService("redhat.your-extension-id")
...

// Call from your extension's activate() function
await telemetryService.sendStartupEvent(); 

...
let event = {
    type: "track",
    name: "Test Event",
};
await telemetryService.send(event);
```

To access the anonymous Red Hat UUID for the current user:
```typescript
import { getRedHatUUID } from "@redhat-developer/vscode-redhat-telemetry";
...
const REDHAT_UUID = await getRedHatUUID();
```

Once your extension has registered a `TelemetryService` instance, a shutdown event, including the session duration, will automatically be sent on its behalf, when VS Code shuts down. However, shutdown event delivery is not guaranteed, as it VS Code might be faster to shutdown than to send those last events.

Starting with vscode-commons 0.0.5, all event properties are automatically sanitized to anonymize all paths (best effort) and references to the username.


## Publicly document your data collection

Once telemetry is in place, you need to document the extent of the telemetry collection performed by your extension.
* add a USAGE_DATA.md page to your extension's repository, listing the type of data being collected by your extension.
* add a `Data and Telemetry` paragraph at the end of your extension's README file:
> `The ***** extension collects anonymous [usage data](USAGE_DATA.md) and sends it to Red Hat servers to help improve our products and services. Read our [privacy statement](https://developers.redhat.com/article/tool-data-collection) to learn more. This extension respects the `redhat.elemetry.enabled` setting which you can learn more about at https://github.com/redhat-developer/vscode-commons#how-to-disable-telemetry-reporting`

* add a reference to your telemetry documentation page to this repository's own [USAGE_DATA.md](https://github.com/redhat-developer/vscode-commons/blob/master/USAGE_DATA.md#other-extensions).

## Turn on logging during development
In your `.vscode/launch.json`, set the `VSCODE_REDHAT_TELEMETRY_DEBUG` environment variable to `true`:
```json
{
  "name": "Run Extension",
  "type": "extensionHost",
  "request": "launch",
  "args": [
    "--extensionDevelopmentPath=${workspaceFolder}"
  ],
  "outFiles": [
    "${workspaceFolder}/dist/**/*.js"
  ],
  "preLaunchTask": "${defaultBuildTask}",
  "env": {
    "VSCODE_REDHAT_TELEMETRY_DEBUG":"true"
  }
},
```

## CI builds
CI builds can be installed manually by following these instructions:

  1) Download the latest development VSIX archive [from here](https://download.jboss.org/jbosstools/snapshots/vscode-commons//?C=M;O=D). `(vscode-commons-XXX.vsix)`

  2) Go to the Extensions section in VSCode.

  3) At the top right click the `...` icon.

  4) Select 'Install from VSIX...' and choose the visx file.
