## Add in package.json for auto download of vscode-commons

- Dependencies to other extensions. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp.

```
  "extensionDependencies": ["redhat.vscode-commons"],
```

## Add the bellow code in your client extensions

```
async function telemetry() {
  const vscodeCommons = vscode.extensions.getExtension("redhat.vscode-commons");
  var vscodeCommonsIsAlive = false;

  if (vscodeCommons?.isActive) {
    console.log("vscodeCommons is active");
    vscodeCommonsIsAlive = true;
  } else {
    console.log("vscodeCommons is not active");
    await vscodeCommons?.activate().then(
      function () {
        console.log("vscodeCommons activated");
        vscodeCommonsIsAlive = true;
      },
      function () {
        console.log("vscodeCommons activation failed");
      }
    );
  }

  if (vscodeCommonsIsAlive) {
    console.log("Inside Alive");

    let vscodeCommonsAPI = vscodeCommons?.exports;
    vscodeCommonsAPI.telemetryData({
      extensionName: "redhat.extensionName",
    });
  } else {
    console.log("await did not work");
  }
```
