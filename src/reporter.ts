import * as vscode from 'vscode';
import Analytics from 'analytics-node';
import { TelemetryEvent } from './interfaces/telemetryEvent';
import { TelemetryEventQueue } from './utils/telemetryEventQueue';

export namespace Reporter {
  let analytics: Analytics;
  let extensionName: string;
  let clientUUID: string;

  export function report(event: TelemetryEvent) {
    if (analyticsExists()) {
      let payload = {
        extensionName: extensionName,
        name: event.name,
        properties: event.properties,
        measures: event.measures,
      };
      switch (event.type) {
        case 'identify':
          getAnalytics()?.identify({
            anonymousId: clientUUID || getRedHatUUID(),
            traits: payload,
          });
          break;
        case 'track':
          getAnalytics()?.track({
            anonymousId: clientUUID || getRedHatUUID(),
            event: event.name || 'track.event',
            properties: event.properties || event.measures,
          });
          break;
        case 'page':
          getAnalytics()?.page({
            anonymousId: clientUUID || getRedHatUUID(),
          });
          break;
        default:
          break;
      }
    }
  }

  function getRedHatUUID() {
    return vscode.env.machineId || 'vscode.developer';
  }

  export function reportQueue(queue: TelemetryEvent[] | undefined) {
    if (queue) {
      queue.forEach((event: TelemetryEvent) => {
        report(event);
      });
      TelemetryEventQueue.dispose();
    }
  }

  export function setClientExtensionName(extensionName: string) {
    extensionName = extensionName;
  }
  export function setClientUUID(clientUUID: string) {
    clientUUID = clientUUID;
  }

  export function setAnalytics(analyticsObject: Analytics) {
    analytics = analyticsObject;
  }
  export function getAnalytics() {
    return analytics;
  }
  export function analyticsExists() {
    return typeof analytics !== 'undefined' && analytics !== null;
  }
}
