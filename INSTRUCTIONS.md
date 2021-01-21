## Add "redhat.vscode-commons" as extension dependency in package.json

- Adding `redhat.vscode-commons` to the `extensionDependencies` section of your extension's package.json allows that dependency to be automatically downloaded and installed, when installing from the Marketplace.

```
  "extensionDependencies": ["redhat.vscode-commons"],
```

## [Optional] Add a custom segment key in package.json file
By default, extensions will send their data to https://app.segment.com/redhat-devtools/sources/vscode/. In development mode, the data is sent to https://app.segment.com/redhat-devtools/sources/vs_code_tests/.

- You can specify custom segment keys to connect and push usage data to https://segment.com/

```
    "segmentWriteKey": "your-segment-key-goes-here",
    "segmentWriteKeyDebug": "your-segment-key-goes-here-for-dev-mode",
```

## Add the below code in your client extensions

```
interface TelemetryEvent {
  name: string;
  type?: string; // type of telemetry event such as : identify, track, page, etc. Defaults to track
  properties?: any;
  measures?: any;
}

async function telemetry(context: vscode.ExtensionContext) {
  // To get an instance of "redhat.vscode-commons"
  const vscodeCommons = vscode.extensions.getExtension("redhat.vscode-commons");
  let vscodeCommonsIsAlive = false;

  if (vscodeCommons?.isActive) {
    vscodeCommonsIsAlive = true;
  } else {
    await vscodeCommons?.activate().then(
      function () {
        // redhat.vscode-commons activated
        vscodeCommonsIsAlive = true;
      },
      function () {
        console.log("redhat.vscode-commons activation failed");
      }
    );
  }

  if (vscodeCommonsIsAlive) {
    const extensionIdentifier = "redhat.alice";
    const vscodeCommonsAPI = vscodeCommons?.exports;

    /*
    A "MUST HAVE" CALL
    set segment key in package.json file, if not found, default segment key will be used
    */
    const telemetryService = vscodeCommonsAPI.getTelemetryService(extensionIdentifier);
    context.subscriptions.push(telemetryService);

    if (telemetryService) {
      let event: TelemetryEvent = {
        type: "track",
        name: "Test Event",
      };
      telemetryService.send({ ...event });
    }
    // get uuid used by vscode-commons
    console.log(`alice: UUID is -> ${vscodeCommonsAPI.getRedHatUUID()}`);

    // vscodeCommonsAPI.viewMessage("Hello vscode-commons, from alice");
  }
}
```
