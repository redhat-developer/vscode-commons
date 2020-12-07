import * as vscode from 'vscode';
import Analytics from 'analytics-node';
import { TelemetryEvent } from '../interfaces/telemetryEvent';
import { Reporter } from '../reporter';
import { Logger } from '../utils/logger';
import { SegmentInitializer } from '../utils/segmentInitializer';
import { TelemetryEventQueue } from '../utils/telemetryEventQueue';
import { privacyUrl, optOutUrl } from '../utils/constants';

/* 
  OPT_IN_STATUS == "true" if user Agreed
  false when denied for telemetry data collection     
*/
const OPT_IN_STATUS = 'redhat.telemetry.optInRequested';

export namespace TelemetryService {
  let analyticsObject: Analytics | undefined;

  /* 
    provides subscription to custom segment key.
    fallback to default segment key if no key provided via API
  */
  export function subscribeTelemetryService(
    clientExtensionName: string,
    clientUUID: string
  ): boolean {
    Reporter.setClientExtensionName(clientExtensionName);
    Reporter.setClientUUID(clientUUID);
    const CLIENT_SEGMENT_KEY: string | undefined = getClientSegmentKey(
      clientExtensionName
    );
    analyticsObject = SegmentInitializer.initialize(CLIENT_SEGMENT_KEY);
    return analyticsObject !== undefined;
  }

  function getClientSegmentKey(
    clientExtensionName: string
  ): string | undefined {
    try {
      const clientPackageJson = vscode.extensions.getExtension(
        clientExtensionName
      )?.packageJSON;
      const clientSegmentKey = clientPackageJson['segmentWriteKey'];
      Logger.log(`client Segment-Key : ${clientSegmentKey}`);
      return clientSegmentKey;
    } catch (error) {
      Logger.log('Unable to get Client Segment-Key');
    }
    return undefined;
  }

  /* 
    Collects telemetry data and pushes to a queue when not opted in
    and to segment when user has opted for telemetry 
  */
  export function sendEvent(event: TelemetryEvent) {
    Logger.log(`Event received: ${event.name}`);
    if (getTelemetryEnabledConfig()) {
      if (analyticsObject) {
        // setting analyticsObject for reporting
        Reporter.setAnalytics(analyticsObject);
        // dequeue the existing queue
        // tslint:disable-next-line: no-unused-expression
        TelemetryEventQueue.getQueue()?.length &&
          Reporter.reportQueue(TelemetryEventQueue.getQueue());
        // report event to segment
        Reporter.report(event);
      } else {
        Logger.log('analytics was not initialized in vscode-commons');
      }
    } else {
      TelemetryEventQueue.addEvent(event);
    }
  }

  /* 
      Checks the current telemetry configuration(package.json) 
      returns "true if telemetry is enabled 
      returns "false" if it is not-enable or undefined(default value)"
  */
  export function getTelemetryEnabledConfig(): boolean {
    return vscode.workspace
      .getConfiguration('redhat.telemetry')
      .get<boolean>('enabled', false);
  }

  export function openTelemetryOptInDialogIfNeeded(
    context: vscode.ExtensionContext
  ) {
    const optInRequested: boolean | undefined = context.globalState.get(
      OPT_IN_STATUS
    );
    Logger.log(`optInRequested is: ${optInRequested}`);

    if (!optInRequested) {
      const command: string = 'vscodeCommons.openWebPage';
      const message: string = `Help Red Hat improve its extensions by allowing them to collect usage data. 
                              Read our [privacy statement](command:${command}?"${privacyUrl}") 
                              and learn how to [opt out](command:${command}?"${optOutUrl}").`;

      vscode.window
        .showInformationMessage(message, 'Accept', 'Deny')
        .then((selection) => {
          if (!selection) {
            //close was chosen. Ask next time.
            return;
          }

          context.globalState.update(OPT_IN_STATUS, true);

          let optIn: boolean = selection === 'Accept';
          updateTelemetryEnabledConfig(optIn);
        });
    }
  }

  function updateTelemetryEnabledConfig(value: boolean): Thenable<void> {
    return vscode.workspace
      .getConfiguration('redhat.telemetry')
      .update('enabled', value, true);
  }

  /*
    open vscode-commons pages. Used in opt in notification(openTelemetryOptInDialogIfNeeded)
  */
  export function openWebPage(url: string) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
  }
}
