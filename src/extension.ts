import * as vscode from "vscode";
import { SegmentInitializer } from "./segmentInitializer";
import { Logger } from "./utils/logger";
import Analytics from "analytics-node";
import { TelemetryEventQueue } from "./utils/telemetryEventQueue";
import { TelemetryEvent } from "./interfaces/telemetryEvent";
import { Reporter } from "./reporter";

/* 
  OPT_IN_STATUS == "true" if user Agreed
  false when denied for telemetry data collection     
*/
const OPT_IN_STATUS = "redhat.telemetry.optInRequested";

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  Logger.log('"vscode-commons" is now active!');

  //  instance of initialized segment object
  const analytics: Analytics | undefined = SegmentInitializer.initialize(
    context
  );

  if (!getTelemetryEnabledConfig()) {
    Logger.log("redhat.telemetry.enabled is false");
    TelemetryEventQueue.initialize();
  } else {
    Logger.log("redhat.telemetry.enabled is true");
  }

  openTelemetryOptInDialogIfNeeded(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeCommons.openWebPage", openWebPage)
  );

  /* 
    listener for configuration change
  */
  context.subscriptions.push(onDidChangeTelemetryEnabled());

  /* 
    test command to activate extension through command pallet
    can be removed later 
  */
  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeCommons.showTelemetryStatus", () => {
      vscode.window.showInformationMessage(
        `Telemetry Enabled: ${getTelemetryEnabledConfig()}`
      );
    })
  );

  /* 
    These are the APIs which  are exposed by this extension
    These APIs can be used in by other extensions as exports
    Please view INTEGRATION.md for more details
  */
  if (analytics) {
    Reporter.setAnalytics(analytics);
    // export to other extensions
    return Promise.resolve({
      telemetryData,
      viewMessage,
    });
  }
}

/* Basic test api MUST BE REMOVED LATER */
function viewMessage(msg: string) {
  vscode.window.showInformationMessage(
    `Msg Received in Vscode-common:  ${msg}`
  );
}

/* 
  Collects telemetry data and pushes to a queue when not opted in
  and to segment when user has enabled telemetry 
*/
function telemetryData(e: TelemetryEvent) {
  Logger.log("Event received:");
  Logger.log(e.extensionName);
  if (getTelemetryEnabledConfig()) {
    // dequeue the existing queue
    TelemetryEventQueue.getQueue()?.length &&
      Reporter.reportQueue(TelemetryEventQueue.getQueue());
    // report event to segment
    Reporter.report(e);
  } else {
    TelemetryEventQueue.addEvent(e);
  }
}

/* 
	Checks the current telemetry configuration(package.json) 
	returns "true if telemetry is enabled 
			"false" if it is not-enable or undefined(default value)"
*/
function getTelemetryEnabledConfig(): boolean {
  return vscode.workspace
    .getConfiguration("redhat.telemetry")
    .get<boolean>("enabled", false);
}

function openTelemetryOptInDialogIfNeeded(context: vscode.ExtensionContext) {
  const optInRequested: boolean | undefined = context.globalState.get(
    OPT_IN_STATUS
  );
  Logger.log(`optInRequested is: ${optInRequested}`);

  if (!optInRequested) {
    const privacyUrl: string =
      "https://github.com/redhat-developer/vscode-commons/wiki/Usage-reporting";
    const command: string = "vscodeCommons.openWebPage";
    const message: string = `Red Hat would like to collect some usage data from its extensions. 
                            [Read our privacy statement](command:${command}?"${privacyUrl}").`;

    vscode.window
      .showInformationMessage(message, "Accept", "Deny")
      .then((selection) => {
        if (!selection) {
          //close was chosen. Ask next time.
          return;
        }

        context.globalState.update(OPT_IN_STATUS, true);

        let optIn: boolean = selection === "Accept";
        updateTelemetryEnabledConfig(optIn);
      });
  }
}

function updateTelemetryEnabledConfig(value: boolean): Thenable<void> {
  return vscode.workspace
    .getConfiguration("redhat.telemetry")
    .update("enabled", value, true);
}

/*
  open vscode-commons privacy page. Used in opt in notification(openTelemetryOptInDialogIfNeeded)
*/
function openWebPage(url: string) {
  vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(url));
}

/* 
A function that represents an event to which you subscribe by calling it with a listener function as argument.

listener — The listener function will be called when the event happens.

thisArgs — The this-argument which will be used when calling the event listener.

disposables — An array to which a disposable will be added.

-return- — A disposable which unsubscribes the event listener.
*/
function onDidChangeTelemetryEnabled(): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration(
    (e: vscode.ConfigurationChangeEvent) => {
      if (!e.affectsConfiguration("redhat.telemetry.enabled")) {
        return;
      }
      if (getTelemetryEnabledConfig()) {
        Logger.log("redhat.telemetry.enabled set to true");
      } else {
        Logger.log("redhat.telemetry.enabled set to false");
        TelemetryEventQueue.initialize();
      }
    }
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
