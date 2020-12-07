## Add "redhat.vscode-commons" as extension dependency in package.json file for auto download of vscode-commons

- Dependencies to other extensions. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp.

```
  "extensionDependencies": ["redhat.vscode-commons"],
```

## Add your custom segment key in package.json file

- This key will be used to connect and push usage data to segment

```
    "segmentWriteKey": "your-segment-key-goes-here",
```

> **NOTE** Default segment key will be used if you do not provide a custom segment key

## Add the bellow code in your client extensions

```
interface TelemetryEvent {
  type?: string; // type of telemetry event such as : identify, track, page, etc.
  name?: string;
  properties?: any;
  measures?: any;
}

async function telemetry(context: vscode.ExtensionContext) {
  // To get an instance of "redhat.vscode-commons"
  const vscodeCommons = vscode.extensions.getExtension("redhat.vscode-commons");
  let vscodeCommonsIsAlive = false;

  if (vscodeCommons?.isActive) {
    console.log("redhat.vscode-commons is active");
    vscodeCommonsIsAlive = true;
  } else {
    console.log("redhat.vscode-commons is not active");
    await vscodeCommons?.activate().then(
      function () {
        console.log("redhat.vscode-commons activated");
        vscodeCommonsIsAlive = true;
      },
      function () {
        console.log("redhat.vscode-commons activation failed");
      }
    );
  }

  if (vscodeCommonsIsAlive) {
    const extensionIdentifier = "redhat.alice";
    const uuid = "redhat@123";
    const vscodeCommonsAPI = vscodeCommons?.exports;

    /*
    A "MUST HAVE" CALL
    set segment key in package.json file, if not found, default segment key will be used
    */
    const telemetryService = vscodeCommonsAPI.getTelemetryService(
      extensionIdentifier,
      uuid
    );
    context.subscriptions.push(telemetryService);

    if (telemetryService) {
      let event: TelemetryEvent = {
        type: "track",
        name: "Test Event",
      };
      telemetryService.sendEvent({ ...event });
    }
    // vscodeCommonsAPI.viewMessage("Hello vscode-commons, from alice");
  }
}
```
