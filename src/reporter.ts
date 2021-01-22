import Analytics from 'analytics-node';
import { TelemetryEvent } from './interfaces/telemetry';
import { enhance } from './utils/events';
import { getExtensionId } from './utils/extensions';
import { Logger } from './utils/logger';
import { UUID } from './utils/uuid';

export class Reporter {
  private analytics: Analytics | undefined;
  private extensionId: string;
  private extensionVersion: string;

  constructor(packageJson: any, analytics: Analytics | undefined) {
    this.extensionId = getExtensionId(packageJson);
    this.extensionVersion = packageJson.version;
    this.analytics = analytics;
  }

  public report(event: TelemetryEvent) {
    if (this.analytics) {
      event = enhance(event, this.extensionId, this.extensionVersion);

      let payload = {
        anonymousId: this.getRedHatUUID(),
        event: event.name,
        properties: event.properties,
        measures: event.measures,
        traits: event.traits,
        context: event.context
      };
      const type = (event.type) ? event.type : 'track';
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
