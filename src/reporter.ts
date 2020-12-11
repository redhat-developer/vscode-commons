import Analytics from 'analytics-node';
import { TelemetryEvent } from './interfaces/telemetryEvent';
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
        extensionName: this.clientExtensionId,
        name: event.name,
        properties: event.properties,
        measures: event.measures,
      };
      switch (event.type) {
        case 'identify':
          this.analytics?.identify({
            anonymousId: this.getRedHatUUID(),
            traits: payload,
          });
          break;
        case 'track':
          this.analytics?.track({
            anonymousId: this.getRedHatUUID(),
            event: event.name || 'track.event',
            properties: event.properties || event.measures,
          });
          break;
        case 'page':
          this.analytics?.page({
            anonymousId: this.getRedHatUUID(),
          });
          break;
        default:
          break;
      }
    }
  }

  private getRedHatUUID():string {
    return UUID.getRedHatUUID();
  }
}
