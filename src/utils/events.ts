import { env, version } from 'vscode';
import { TelemetryEvent } from '../interfaces/telemetryEvent';
import { COUNTRY, LOCALE, PLATFORM, PLATFORM_VERSION, TIMEZONE } from './platform';

export function enhance(event: TelemetryEvent, extensionId: string, extensionVersion: string): TelemetryEvent {
  //Inject Client name and version,  Extension id and version, and timezone to the event properties  
  const properties = event.properties ? event.properties : {};
  properties.clientName = env.appName;
  properties.clientVersion = version;
  properties.extensionId = extensionId;
  properties.extensionVersion = extensionVersion;
  properties.timezone = TIMEZONE;

  //Inject Plateform specific data in segment's context, so it can be recognized by the end destination
  const context = event.context ? event.context : {};
  context.ip = '0.0.0.0';
  context.os = {
    name: PLATFORM,
    version: PLATFORM_VERSION,
  };
  context.locale = LOCALE;
  context.location = {
    // This is inacurate in some cases (user uses a different locale than from his actual country), 
    // but still provides an interesting metric in most cases. 
    country: COUNTRY
  };
  context.timezone = TIMEZONE;

  const enhancedEvent: TelemetryEvent = {
    name: event.name,
    type: event.type, // type of telemetry event such as : identify, track, page, etc.
    properties: properties,
    measures: event.measures,
    traits: event.measures,
    context: context
  };
  return enhancedEvent;
}