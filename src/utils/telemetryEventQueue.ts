import { TelemetryEvent } from "../interfaces/telemetryEvent";

let queue: TelemetryEvent[] | undefined;
export namespace TelemetryEventQueue {
  export function initialize() {
    queue = [];
  }

  export function addEvent(e: TelemetryEvent) {
    if (queue) {
      queue.push(e);
    }
  }

  export function deInitialize() {
    queue = undefined;
  }
  export function getQueue() {
    return queue;
  }
}
