import * as vscode from "vscode";
import Analytics from "analytics-node";
import { TelemetryEvent } from "./interfaces/telemetryEvent";
import { Logger } from "./utils/logger";
import { TelemetryEventQueue } from "./utils/telemetryEventQueue";

export namespace Reporter {
  let analytics: Analytics | undefined;

  export function report(event: TelemetryEvent) {
    if (analyticsExists()) {
      let payload = {
        extensionName: event.extensionName,
        name: event.name,
        properties: event.properties,
        measures: event.measures,
      };
      switch (event.type) {
        case "identify":
          getAnalytics()?.identify({
            anonymousId:
              event.uuid || vscode.env.machineId || "vscode.developer",
            traits: payload,
          });
          break;
        case "track":
          getAnalytics()?.track({
            anonymousId:
              event.uuid || vscode.env.machineId || "vscode.developer",
            event: event.name || "track.event",
            properties: event.properties ? event.properties : event.measures,
          });
          break;
        case "page":
          getAnalytics()?.page({
            anonymousId:
              event.uuid || vscode.env.machineId || "vscode.developer",
          });
          break;
        default:
          break;
      }
    }
  }

  export function reportQueue(queue: TelemetryEvent[] | undefined) {
    if (queue) {
      queue.forEach((event: TelemetryEvent) => {
        report(event);
      });
      TelemetryEventQueue.deInitialize();
    }
  }

  export function setAnalytics(analyticsObject: Analytics) {
    analytics = analyticsObject;
  }
  export function getAnalytics() {
    return analytics;
  }
  export function analyticsExists() {
    return typeof analytics !== "undefined" && analytics !== null;
  }
}
