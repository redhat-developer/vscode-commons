import { TelemetryEvent } from '../interfaces/telemetryEvent';

let queue: TelemetryEvent[] | undefined;
export namespace TelemetryEventQueue {
  const MAX_QUEUE_SIZE = 5;
  export function initialize() {
    queue = [];
  }

  export function addEvent(e: TelemetryEvent) {
    if (queue?.length === MAX_QUEUE_SIZE) {
      queue?.shift();
    }
    queue?.push(e);
  }

  export function dispose() {
    queue = undefined;
  }
  export function getQueue() {
    return queue;
  }
}
