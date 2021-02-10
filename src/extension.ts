import { TelemetryService, TelemetryServiceBuilder } from '@redhat-developer/vscode-redhat-telemetry';
import { Logger } from '@redhat-developer/vscode-redhat-telemetry/lib/utils/logger';
import { getEnvironment } from '@redhat-developer/vscode-redhat-telemetry/lib/utils/platform-node';
import { commands, ConfigurationChangeEvent, Disposable, ExtensionContext, extensions, Uri, window, workspace } from 'vscode';
import { VSCodeSettings } from './services/settings-vscode';
import { OPT_IN_STATUS_KEY, OPT_OUT_INSTRUCTIONS_URL, PRIVACY_STATEMENT_URL } from './utils/constants';
import { IdManagerFactory } from './services/idManagerFactory';

const telemetryServices = new Map<string, TelemetryService>();
const idManager = IdManagerFactory.getIdManager();

let settings: VSCodeSettings;
let defaultSegmentWriteKey: string;
let defaultSegmentWriteKeyDebug: string;
let retryOptin: NodeJS.Timeout;
const RETRY_OPTIN_DELAY = 86400000;// 24h
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

    telemetryService = await builder.build();
    telemetryServices.set(clientExtensionId, telemetryService);
  }
  return telemetryService;
}

/* returns the Red Hat anonymous uuid used by vscode-commons */
function getRedHatUUID(): Promise<string> {
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

async function openTelemetryOptInDialogIfNeeded(context: ExtensionContext) {
  logTelemetryStatus();
  const optInRequested: boolean | undefined = context.globalState.get(OPT_IN_STATUS_KEY);

  Logger.log(`optInRequested is: ${optInRequested}`);

  if (optInRequested) {
    if (retryOptin) {
      clearInterval(retryOptin);
    }
    return;
  }

  if (!retryOptin) {
    retryOptin = setInterval(openTelemetryOptInDialogIfNeeded, RETRY_OPTIN_DELAY, context);
  }

  const command: string = 'vscodeCommons.openWebPage';
  const message: string = `Help Red Hat improve its extensions by allowing them to collect usage data. 
    Read our [privacy statement](command:${command}?"${PRIVACY_STATEMENT_URL}") 
  and learn how to [opt out](command:${command}?"${OPT_OUT_INSTRUCTIONS_URL}").`;

  const selection = await window.showInformationMessage(message, 'Accept', 'Deny');
  if (!selection) {
    //close was chosen. Ask next time.
    return;
  }
  clearInterval(retryOptin);
  context.globalState.update(OPT_IN_STATUS_KEY, true);

  const optIn: boolean = selection === 'Accept';
  if (optIn) {
    //increase the chances of writing the anonymousUUID on disk
    // before any other extension
    await getRedHatUUID();
  }
  settings.updateTelemetryEnabledConfig(optIn);
}

/*
  open vscode-commons pages. Used in opt in notification(openTelemetryOptInDialogIfNeeded)
*/
export function openWebPage(url: string) {
  commands.executeCommand('vscode.open', Uri.parse(url));
}

// this method is called when your extension is deactivated
export async function deactivate() {
  const finishAll: Promise<void>[] = [];
  telemetryServices.forEach((telemetryService: TelemetryService, k: string) => {
    finishAll.push(
      telemetryService.sendShutdownEvent().then(() => {
        telemetryService.dispose();
      })
    );
  });
  return Promise.all(finishAll);
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
