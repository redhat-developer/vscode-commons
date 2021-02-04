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

## CI builds
CI builds can be installed manually by following these instructions:

  1) Download the latest development VSIX archive [from here](https://download.jboss.org/jbosstools/snapshots/vscode-commons//?C=M;O=D). `(vscode-commons-XXX.vsix)`

  2) Go to the Extensions section in VSCode.

  3) At the top right click the `...` icon.

  4) Select 'Install from VSIX...' and choose the visx file.
