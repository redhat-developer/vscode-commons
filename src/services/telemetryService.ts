import * as vscode from 'vscode';
import { TelemetryEvent } from '../interfaces/telemetryEvent';
import { Reporter } from '../reporter';
import { Logger } from '../utils/logger';
import { Settings } from './Settings';
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
    // provides subscription to custom segment key.
    const segmentKey: string | undefined = TelemetryService.getClientSegmentKey(clientExtensionId);
    // fallback to default segment key if no key provided via API
    const analytics = SegmentInitializer.initialize(segmentKey);
    const reporter = new Reporter(clientExtensionId, analytics);
    const queue = Settings.isTelemetryConfigured() ? new TelemetryEventQueue() : undefined;
    return new TelemetryService(reporter, queue);
  }


  public static getClientSegmentKey(clientExtensionName: string): string | undefined {
    try {
      const clientPackageJson = vscode.extensions.getExtension(clientExtensionName)?.packageJSON;
      const clientSegmentKey = clientPackageJson['segmentWriteKey'];
      Logger.log(`client segmentWriteKey : ${clientSegmentKey}`);
      return clientSegmentKey;
    } catch (error) {
      Logger.log(`Unable to get '${clientExtensionName}' Segment-Key`);
    }
    return undefined;
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
