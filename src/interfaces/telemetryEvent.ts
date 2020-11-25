export interface TelemetryEvent {
  extensionName: string; // name of extension
  uuid?: string;
  type?: string; // type of telemetry event such as : identify, track, page, etc.
  name?: string;
  properties?: any;
  measures?: any;
}
