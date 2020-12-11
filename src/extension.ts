import {
  window,
  commands,
  ExtensionContext,
  ConfigurationChangeEvent,
  Disposable,
  workspace,
  Uri,
} from 'vscode';
import { Logger } from './utils/logger';
import { TelemetryService } from './services/telemetryService';
import { UUID } from './utils/uuid';
import {
  OPT_IN_STATUS_KEY,
  PRIVACY_STATEMENT_URL,
  OPT_OUT_INSTRUCTIONS_URL,
  CONFIG_KEY,
} from './utils/constants';
import { Settings } from './services/settings';

const telemetryServices = new Map<string, TelemetryService>();

// this method is called when your extension is activated
export function activate(context: ExtensionContext) {
  Logger.log('"vscode-commons" is now active!');

  context.subscriptions.push(
    commands.registerCommand('vscodeCommons.openWebPage', openWebPage)
  );
  /* 
  listener for configuration change
  */
  context.subscriptions.push(onDidChangeTelemetryEnabled());

  // MUST BE REMOVED BEFORE RELEASE
  registerTestCommands(context);

  openTelemetryOptInDialogIfNeeded(context);
  /* 
  These are the APIs which  are exposed by this extension
  These APIs can be used in by other extensions as exports
  Please view INSTRUCTIONS.md for more details
  */
  // export to other extensions
  return Promise.resolve({
    getTelemetryService,
    getRedHatUUID,
    // MUST BE REMOVED BEFORE RELEASE
    viewMessage,
  });
}

function getTelemetryService(clientExtensionId: string) {
  let telemetryService = telemetryServices.get(clientExtensionId);
  if (!telemetryService) {
    telemetryService = TelemetryService.initialize(clientExtensionId);
    telemetryServices.set(clientExtensionId, telemetryService);
  }
  return telemetryService;
}

/* returns the Red Hat anonymous uuid used by vscode-commons */
function getRedHatUUID() {
  return UUID.getRedHatUUID();
}

function logTelemetryStatus() {
  if (Settings.isTelemetryEnabled()) {
    Logger.log('Red Hat Telemetry is enabled');
  } else {
    Logger.log('Red Hat Telemetry is disabled');
  }
}

function onDidChangeTelemetryEnabled(): Disposable {
  return workspace.onDidChangeConfiguration(
    //as soon as user changed the redhat.telemetry setting, we consider
    //opt-in (or out) has been set, so whichever the choice is, we flush the queue
    (e: ConfigurationChangeEvent) => {
      logTelemetryStatus();
      telemetryServices.forEach(
        (telemetryService: TelemetryService, k: string) => {
          telemetryService.flushQueue();
        }
      );
    }
  );
}

export function openTelemetryOptInDialogIfNeeded(context: ExtensionContext) {
  logTelemetryStatus();

  const optInRequested: boolean | undefined = context.globalState.get(
    OPT_IN_STATUS_KEY
  );
  Logger.log(`optInRequested is: ${optInRequested}`);

  if (!optInRequested) {
    const command: string = 'vscodeCommons.openWebPage';
    const message: string = `Help Red Hat improve its extensions by allowing them to collect usage data. 
                            Read our [privacy statement](command:${command}?"${PRIVACY_STATEMENT_URL}") 
                            and learn how to [opt out](command:${command}?"${OPT_OUT_INSTRUCTIONS_URL}").`;

    window
      .showInformationMessage(message, 'Accept', 'Deny')
      .then((selection) => {
        if (!selection) {
          //close was chosen. Ask next time.
          return;
        }

        context.globalState.update(OPT_IN_STATUS_KEY, true);

        let optIn: boolean = selection === 'Accept';
        Settings.updateTelemetryEnabledConfig(optIn);
      });
  }
}

/*
  open vscode-commons pages. Used in opt in notification(openTelemetryOptInDialogIfNeeded)
*/
export function openWebPage(url: string) {
  commands.executeCommand('vscode.open', Uri.parse(url));
}

// this method is called when your extension is deactivated
export function deactivate() {
  telemetryServices.forEach((telemetryService: TelemetryService, k: string) => {
    telemetryService.dispose();
  });
}

// THOSE FUNCTIONS MUST BE REMOVED BEFORE RELEASE
function registerTestCommands(context: ExtensionContext) {
  /* 
  test command to activate and  view telemetry status of 
  extension through command pallet can be removed later 
  */
  context.subscriptions.push(
    commands.registerCommand('vscodeCommons.showTelemetryStatus', () => {
      window.showInformationMessage(
        `Red Hat Telemetry Enabled: ${Settings.isTelemetryEnabled()}`
      );
    })
  );

  context.subscriptions.push(
    commands.registerCommand('vscodeCommons.clearStateAndSettings', () => {
      context.globalState.update(OPT_IN_STATUS_KEY, undefined);
      return workspace
        .getConfiguration(CONFIG_KEY)
        .update('enabled', undefined, true);
    })
  );
}

function viewMessage(msg: string) {
  window.showInformationMessage(`Msg Received in vscode-commons:  ${msg}`);
}
