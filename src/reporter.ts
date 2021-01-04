import Analytics from 'analytics-node';
import { TelemetryEvent } from './interfaces/telemetryEvent';
import { Logger } from './utils/logger';
import { UUID } from './utils/uuid';

export class Reporter {
  private analytics: Analytics | undefined;
  private clientExtensionId: string;

  constructor(clientExtensionId: string, analytics: Analytics | undefined) {
    this.clientExtensionId = clientExtensionId;
    this.analytics = analytics;
  }

  public report(event: TelemetryEvent) {
    if (this.analytics) {
      let payload = {
        anonymousId: this.getRedHatUUID(),
        extensionName: this.clientExtensionId,
        event: event.name,
        properties: event.properties,
        measures: event.measures,
        traits: event.traits
      };
      const type = (event.type)?event.type:'track';
      Logger.log(`Sending ${type} event with\n${JSON.stringify(payload)}`);
      switch (type) {
        case 'identify':
          this.analytics?.identify(payload);
          break;
        case 'track':
          this.analytics?.track(payload);
          break;
        case 'page':
          this.analytics?.page(payload);
          break;
        default:
          break;
      }
    }
  }

  private getRedHatUUID(): string {
    return UUID.getRedHatUUID();
  }

}
