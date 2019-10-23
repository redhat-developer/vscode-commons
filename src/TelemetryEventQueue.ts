import { Event } from './Event';
import { Reporter } from './Reporter';

let queue: Event[] | undefined;
export namespace TelemetryEventQueue {
  export function initialize() {
    queue = [];
  }

  export function addEvent(e: Event) {
    if (queue) {
      queue.push(e);
    }
  }

  export function reportAllAndDestroy() {
    if (queue) {
      queue.forEach((e: Event) => Reporter.report(e));
    }
    queue = undefined;
  }
}