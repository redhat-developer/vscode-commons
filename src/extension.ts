import { TelemetryService, TelemetryServiceBuilder } from '@redhat-developer/vscode-redhat-telemetry';
import { FileSystemIdManager } from '@redhat-developer/vscode-redhat-telemetry/lib/services/fileSystemIdManager';
import { Logger } from '@redhat-developer/vscode-redhat-telemetry/lib/utils/logger';
import { getEnvironment } from '@redhat-developer/vscode-redhat-telemetry/lib/utils/platform-node';
import { commands, ConfigurationChangeEvent, Disposable, ExtensionContext, extensions, Uri, window, workspace } from 'vscode';
import { VSCodeSettings } from './services/settings-vscode';
import { CONFIG_KEY, OPT_IN_STATUS_KEY, OPT_OUT_INSTRUCTIONS_URL, PRIVACY_STATEMENT_URL } from './utils/constants';

const telemetryServices = new Map<string, TelemetryService>();
const idManager = new FileSystemIdManager();

let settings: VSCodeSettings;
let defaultSegmentWriteKey: string;
let defaultSegmentWriteKeyDebug: string;

// this method is called when your extension is activated
export async function activate(context: ExtensionContext) {
  Logger.log('"vscode-commons" is now active!');
  const commonsPackageJson = require('../package.json');
  settings = new VSCodeSettings();
  defaultSegmentWriteKey = commonsPackageJson.segmentWriteKey;
  defaultSegmentWriteKeyDebug = commonsPackageJson.segmentWriteKeyDebug;

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

  const telemetryService = await getTelemetryService('redhat.vscode-commons');
  context.subscriptions.push(telemetryService);
  telemetryService.send({
    type: 'identify',
    name: 'identify'
  });
  telemetryService.sendStartupEvent();

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

async function getTelemetryService(clientExtensionId: string): Promise<TelemetryService> {
  let telemetryService = telemetryServices.get(clientExtensionId);
  if (!telemetryService) {
    const packageJson = getPackageJson(clientExtensionId);
    if (!packageJson) {
      throw new Error(`Invalid extension ${clientExtensionId}`);
    }
    const builder = new TelemetryServiceBuilder(packageJson)
      .setSettings(settings)
      .setIdManager(idManager)
      .setEnvironment(await getEnvironment(clientExtensionId, packageJson.version));

    telemetryService = builder.build();
    telemetryServices.set(clientExtensionId, telemetryService);
  }
  return telemetryService;
}

/* returns the Red Hat anonymous uuid used by vscode-commons */
function getRedHatUUID() {
  return idManager.getRedHatUUID();
}

function logTelemetryStatus() {
  if (settings.isTelemetryEnabled()) {
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
        if (optIn) {
          //increase the chances of writing the anonymousUUID on disk 
          // before any other extension 
          getRedHatUUID();
        }
        settings.updateTelemetryEnabledConfig(optIn);
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
    telemetryService.sendShutdownEvent();
    telemetryService.dispose();
  });
}

// THOSE FUNCTIONS MUST BE REMOVED BEFORE RELEASE
function registerTestCommands(context: ExtensionContext) {
  /* 
  test command to activate and  view telemetry status of 
  extension through command palette, can be removed later. 
  */
  context.subscriptions.push(
    commands.registerCommand('vscodeCommons.showTelemetryStatus', async () => {
      (await getTelemetryService('redhat.vscode-commons')).send({
        name: 'test',
        properties: {
          payload: 'Lorem Ipsum...',
          extensions: ['one', 'two', 'three']
        }
      });
      window.showInformationMessage(
        `Red Hat Telemetry Enabled: ${settings.isTelemetryEnabled()}`
      );
      window.showInformationMessage(
        `Red Hat anonymous Id : ${getRedHatUUID()}`
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

function getPackageJson(extensionId: string): any {
  let packageJson = extensions.getExtension(extensionId)?.packageJSON;
  if (!packageJson) {
    return null;
  }
  if (!packageJson.segmentWriteKey) {
    packageJson.segmentWriteKey = defaultSegmentWriteKey;
  }
  if (!packageJson.segmentWriteKeyDebug) {
    packageJson.segmentWriteKeyDebug = defaultSegmentWriteKeyDebug;
  }
  return packageJson;
}