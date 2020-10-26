import * as vscode from 'vscode';

import { TelemetryEvent } from './TelemetryEvent';
import { TelemetryEventQueue } from './TelemetryEventQueue';
import { Reporter } from './Reporter';
import { Logger } from './Logger';

const OPTIN_REQUESTED_KEY = 'redhat.telemetry.optInRequested';

export function activate(context: vscode.ExtensionContext) {
  Reporter.initialize(context);

  if (!getTelemetryEnabledConfig()) {
    Logger.log('redhat.telemetry.enabled is false');
    TelemetryEventQueue.initialize();
  } else {
    Logger.log('redhat.telemetry.enabled is true');
  }

  openTelemetryOptInDialogIfNeeded(context);

  context.subscriptions.push(onDidChangeTelemetryEnabled());

  // This command exists only for testing purposes. Should delete later.
  context.subscriptions.push(vscode.commands.registerCommand('vscodeCommons.clearStateAndSettings', () => {
    context.globalState.update('optInRequested', undefined);
    vscode.workspace.getConfiguration('redhat.telemetry').update('enabled', undefined, true);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('vscodeCommons.openWebPage', openWebPage));

  if (Reporter.isConnected()) {
    // export to other extensions
    return Promise.resolve({
      reportIfOptIn
    });
  }
}

function reportIfOptIn(e: TelemetryEvent) {

  // Logger.log('Event received:');
  // Logger.log(JSON.stringify(e));

  if (getTelemetryEnabledConfig()) {
    Reporter.report(e);
  } else {
    TelemetryEventQueue.addEvent(e);
  }
}

function openTelemetryOptInDialogIfNeeded(context: vscode.ExtensionContext) {
  const optInRequested: boolean | undefined = context.globalState.get(OPTIN_REQUESTED_KEY);
  if (!optInRequested) {
    const privacyUrl: string = 'https://github.com/redhat-developer/vscode-commons/wiki/Usage-reporting';
    const command: string = 'vscodeCommons.openWebPage';
    const message: string = `Red Hat would like to collect some usage data from its extensions. [Read our privacy statement](command:${command}?"${privacyUrl}").`;

    vscode.window.showInformationMessage(message, 'Accept', 'Deny').then((selection) => {
      if (!selection) {
        //close was chosen. Ask next time.
        return;
      }

      context.globalState.update(OPTIN_REQUESTED_KEY, true);

      let optIn: boolean = selection === 'Accept';
      updateTelemetryEnabledConfig(optIn);
    });
  }
}

function openWebPage(url: string) {
  vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
}

function getTelemetryEnabledConfig(): boolean {
  return vscode.workspace.getConfiguration('redhat.telemetry').get<boolean>('enabled', false);
}

function updateTelemetryEnabledConfig(value: boolean): Thenable<void> {
  return vscode.workspace.getConfiguration('redhat.telemetry').update('enabled', value, true);
}

function onDidChangeTelemetryEnabled(): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
    if (!e.affectsConfiguration('redhat.telemetry.enabled')) {
      return;
    }
    if (getTelemetryEnabledConfig()) {
      Logger.log('redhat.telemetry.enabled set to true');
      TelemetryEventQueue.reportAllAndDestroy();
    } else {
      Logger.log('redhat.telemetry.enabled set to false');
      TelemetryEventQueue.initialize();
    }
  });
}