## Add in package.json for auto download of vscode-commons

- Dependencies to other extensions. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp.

```
  "extensionDependencies": ["redhat.vscode-commons"],
```

## Add the bellow code in your client extensions

```
interface TelemetryEvent {
  extensionName: string; // name of extension
  uuid?: string;
  type?: string; // type of telemetry event such as : identify, track, page, etc.
  name?: string;
  properties?: any;
  measures?: any;
}

async function telemetry(context: vscode.ExtensionContext) {
  /*
    Set segment_key in context.globalState
    provide your custom segment key or comment below two lines
  */
  const SEGMENT_KEY = "abcdefghijklmnopqrstuvwxyz";
  context.globalState.update("SEGMENT_KEY", SEGMENT_KEY);

  // To get an instance of the Extension
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
    let vscodeCommonsAPI = vscodeCommons?.exports;
    let telemetryService = vscodeCommonsAPI.TelemetryService;
    /*
    returns true if subscribed else returns false. A "MUST HAVE" CALL
    set segment key in globalState (SEGMENT_KEY), if not found, default segment key will be used
    */
    let subscriptionStatus: boolean = telemetryService.subscribeTelemetryService(
      context
    );
    console.log(subscriptionStatus, "subscriptionStatus");

    if (subscriptionStatus) {
      let event: TelemetryEvent = {
        extensionName: "redhat.extensionName",
        type: "track",
      };
      telemetryService.sendEvent({ ...event });
    }
    // vscodeCommonsAPI.viewMessage("Hello vscode-commons, from alice");
  }
}
```
