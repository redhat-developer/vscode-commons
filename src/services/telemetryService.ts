import * as vscode from "vscode";
import { TelemetryEvent } from "../interfaces/telemetryEvent";
import { Reporter } from "../reporter";
import { Logger } from "../utils/logger";
import { TelemetryEventQueue } from "../utils/telemetryEventQueue";

/* 
  OPT_IN_STATUS == "true" if user Agreed
  false when denied for telemetry data collection     
*/
const OPT_IN_STATUS = "redhat.telemetry.optInRequested";

export namespace TelemetryService {
  /* 
  Collects telemetry data and pushes to a queue when not opted in
  and to segment when user has enabled telemetry 
*/
  export function telemetryData(e: TelemetryEvent) {
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
  export function getTelemetryEnabledConfig(): boolean {
    return vscode.workspace
      .getConfiguration("redhat.telemetry")
      .get<boolean>("enabled", false);
  }

  export function openTelemetryOptInDialogIfNeeded(
    context: vscode.ExtensionContext
  ) {
    const optInRequested: boolean | undefined = context.globalState.get(
      OPT_IN_STATUS
    );
    Logger.log(`optInRequested is: ${optInRequested}`);

    if (!optInRequested) {
      const privacyUrl: string =
        "https://github.com/redhat-developer/vscode-commons/wiki/Usage-reporting";
      const optOutUrl: string =
        "https://github.com/redhat-developer/vscode-commons/wiki/Usage-reporting";
      const command: string = "vscodeCommons.openWebPage";
      const message: string = `Help Red Hat improve its extensions by allowing them to collect usage data. 
                              Read our [privacy statement](command:${command}?"${privacyUrl}") 
                              and learn how to [opt out](command:${command}?"${optOutUrl}").`;

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
    open vscode-commons pages. Used in opt in notification(openTelemetryOptInDialogIfNeeded)
  */
  export function openWebPage(url: string) {
    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(url));
  }
}
