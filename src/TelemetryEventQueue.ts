import { TelemetryEvent } from './TelemetryEvent';
import { Reporter } from './Reporter';

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

  export function reportAllAndDestroy() {
    if (queue) {
      queue.forEach((e: TelemetryEvent) => Reporter.report(e));
    }
    queue = undefined;
  }
}