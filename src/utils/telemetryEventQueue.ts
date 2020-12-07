import { TelemetryEvent } from '../interfaces/telemetryEvent';

let queue: TelemetryEvent[] | undefined;
export namespace TelemetryEventQueue {
  const MAX_QUEUE_SIZE = 35;
  export function initialize() {
    queue = [];
  }
  /*
    split() should work fine until we choose to have high MAX_QUEUE_SIZE
   */
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
