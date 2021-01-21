import * as vscode from 'vscode';
import { TelemetryEvent } from '../interfaces/telemetryEvent';
import { Reporter } from '../reporter';
import { Logger } from '../utils/logger';
import { Settings } from './settings';
import { SegmentInitializer } from '../utils/segmentInitializer';
import { TelemetryEventQueue } from '../utils/telemetryEventQueue';

export class TelemetryService {
  private reporter: Reporter;
  private queue: TelemetryEventQueue | undefined;

  constructor(reporter: Reporter, queue: TelemetryEventQueue | undefined) {
    this.reporter = reporter;
    this.queue = queue;
  }

  public static initialize(clientExtensionId: string): TelemetryService {
    let clientPackageJson = vscode.extensions.getExtension(clientExtensionId)?.packageJSON;
    const analytics = SegmentInitializer.initialize(clientPackageJson);
    const reporter = new Reporter(clientPackageJson, analytics);
    const queue = Settings.isTelemetryConfigured()
      ? undefined
      : new TelemetryEventQueue();
    return new TelemetryService(reporter, queue);
  }

  /* 
    Collects telemetry data and pushes to a queue when not opted in
    and to segment when user has opted for telemetry 
  */
  public send(event: TelemetryEvent) {
    Logger.log(`Event received: ${event.name}`);
    if (Settings.isTelemetryEnabled()) {
      // flush whatever was in the queue, however it's unlikely there's anything left at this point.
      this.flushQueue();
      this.sendEvent(event);
    } else if (!Settings.isTelemetryConfigured()) {
      // Still waiting for opt-in?, then queue events
      this.queue?.addEvent(event);
    }
  }

  public sendStartupEvent() {
    this.send({ name: 'startup' });
  }
  public sendShutdownEvent() {
    this.send({ name: 'shutdown' });
  }

  private sendEvent(event: TelemetryEvent) {
    this.reporter.report(event);
  }

  public flushQueue() {
    const eventsToFlush = this.queue?.events;
    if (eventsToFlush && Settings.isTelemetryEnabled()) {
      while (eventsToFlush.length > 0) {
        const event = this.queue?.events?.shift();
        if (event) {
          this.sendEvent(event);
        }
      }
    }
    // No matter what, we need to empty the queue if it exists
    this.queue?.emptyQueue();
  }

  public dispose() {
    this.queue?.emptyQueue();
  }

}
