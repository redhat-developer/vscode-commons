export interface TelemetryEvent {
  type?: string; // type of telemetry event such as : identify, track, page, etc.
  name?: string;
  properties?: any;
  measures?: any;
}
