import * as vscode from 'vscode';
import { Logger } from './utils/logger';
import { TelemetryEventQueue } from './utils/telemetryEventQueue';
import { TelemetryService } from './services/telemetryService';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  Logger.log('"vscode-commons" is now active!');

  /* 
    check for current status of telemetry true | false
    initialize events queue to preserve events 
  */
  if (!TelemetryService.getTelemetryEnabledConfig()) {
    Logger.log('redhat.telemetry.enabled is false');
    TelemetryEventQueue.initialize();
  } else {
    Logger.log('redhat.telemetry.enabled is true');
  }

  TelemetryService.openTelemetryOptInDialogIfNeeded(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscodeCommons.openWebPage',
      TelemetryService.openWebPage
    )
  );

  /* 
    listener for configuration change
  */
  context.subscriptions.push(onDidChangeTelemetryEnabled());

  /* 
    test command to activate and  view telemetry status of 
    extension through command pallet can be removed later 
  */
  context.subscriptions.push(
    vscode.commands.registerCommand('vscodeCommons.showTelemetryStatus', () => {
      vscode.window.showInformationMessage(
        `Red Hat Telemetry Enabled: ${TelemetryService.getTelemetryEnabledConfig()}`
      );
    })
  );

  // This command exists only for testing purposes. Should delete later.
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscodeCommons.clearStateAndSettings',
      () => {
        context.globalState.update('OPT_IN_STATUS', undefined);
        vscode.workspace
          .getConfiguration('redhat.telemetry')
          .update('enabled', undefined, true);
      }
    )
  );

  /* 
    These are the APIs which  are exposed by this extension
    These APIs can be used in by other extensions as exports
    Please view INTEGRATION.md for more details
  */
  // export to other extensions
  return Promise.resolve({
    TelemetryService,
    viewMessage,
  });
}

/* Basic test api MUST BE REMOVED LATER */
function viewMessage(msg: string) {
  vscode.window.showInformationMessage(
    `Msg Received in Vscode-common:  ${msg}`
  );
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
      if (!e.affectsConfiguration('redhat.telemetry.enabled')) {
        return;
      }
      if (TelemetryService.getTelemetryEnabledConfig()) {
        Logger.log('redhat.telemetry.enabled set to true');
      } else {
        Logger.log('redhat.telemetry.enabled set to false');
        TelemetryEventQueue.initialize();
      }
    }
  );
}

// this method is called when your extension is deactivated
// tslint:disable-next-line: no-empty
export function deactivate() {}
