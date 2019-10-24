import * as vscode from 'vscode';

import { Event } from './Event';
import { TelemetryEventQueue } from './TelemetryEventQueue';
import { Reporter } from './Reporter';
import { Logger } from './Logger';

export function activate(context: vscode.ExtensionContext) {
  Reporter.initialize(context);

  if (!getTelemetryEnabledConfig()) {
    Logger.log('redhat.telemetry.enabled is false');
    TelemetryEventQueue.initialize();
  } else {
    Logger.log('redhat.telemetry.enabled is true');
  }

  openTelemetryOptInDialogIfNeeded(context);

  context.subscriptions.push(onDidChangeTelemetryEnabledToTrue(TelemetryEventQueue.reportAllAndDestroy));
  context.subscriptions.push(onDidChangeTelemetryEnabledToFalse(TelemetryEventQueue.initialize));

  // This command exists only for testing purposes. Should delete later.
  context.subscriptions.push(vscode.commands.registerCommand('extension.clearContextGlobalState', () => {
    context.globalState.update('optInRequested', undefined);
  }));

  if (Reporter.isConnected()) {

    // export to other extensions
    return Promise.resolve({
      reportIfOptIn
    });
  }
}

function reportIfOptIn(e: Event) {

  // Logger.log('Event received:');
  // Logger.log(JSON.stringify(e));

  if (getTelemetryEnabledConfig()) {
    Reporter.report(e);
  } else {
    TelemetryEventQueue.addEvent(e);
  }
}

function openTelemetryOptInDialogIfNeeded(context: vscode.ExtensionContext) {
  const optInRequested: boolean | undefined = context.globalState.get('optInRequested');
  if (!optInRequested) {
    vscode.window.showInformationMessage('Java extension would like to report some usage data', 'More Information', 'Accept', 'Deny').then((selection) => {
      if (!selection) {
        //close was chosen. Ask next time.
        return;
      }
      if (selection === 'More Information') {
        //open wiki page
        openWebPage('https://github.com/redhat-developer/vscode-java/wiki/Usage-reporting');
        //reopen dialog immediately
        openTelemetryOptInDialogIfNeeded(context);
        return;
      }
      context.globalState.update('optInRequested', true);

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

function onDidChangeTelemetryEnabledToTrue(func: Function, ...args: any[]): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
    if (e.affectsConfiguration('redhat.telemetry.enabled') && getTelemetryEnabledConfig()) {
      Logger.log('redhat.telemetry.enabled set to true');
      func(args);
    }
  });
}

function onDidChangeTelemetryEnabledToFalse(func: Function, ...args: any[]): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
    if (e.affectsConfiguration('redhat.telemetry.enabled') && !getTelemetryEnabledConfig()) {
      Logger.log('redhat.telemetry.enabled set to false');
      func(args);
    }
  });
}