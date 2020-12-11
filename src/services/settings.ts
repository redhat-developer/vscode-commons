import { workspace, WorkspaceConfiguration } from 'vscode';
import { CONFIG_KEY } from '../utils/constants';

export namespace Settings {
  export function isTelemetryConfigured(): boolean {
    return isPreferenceOverridden(CONFIG_KEY + '.enabled');
  }

  /* 
    Checks the current telemetry configuration(package.json) 
    returns "true if telemetry is enabled 
    returns "false" if it is not-enable or undefined(default value)"
  */
  export function isTelemetryEnabled(): boolean {
    return getTelemetryConfiguration().get<boolean>('enabled', false);
  }

  export function updateTelemetryEnabledConfig(value: boolean): Thenable<void> {
    return getTelemetryConfiguration().update('enabled', value, true);
  }

  export function getTelemetryConfiguration(): WorkspaceConfiguration {
    return workspace.getConfiguration(CONFIG_KEY);
  }

  export function isPreferenceOverridden(section: string): boolean {
    const config = workspace.getConfiguration().inspect(section);
    return (
      config?.workspaceFolderValue !== undefined ||
      config?.workspaceFolderLanguageValue !== undefined ||
      config?.workspaceValue !== undefined ||
      config?.workspaceLanguageValue !== undefined ||
      config?.globalValue !== undefined ||
      config?.globalLanguageValue !== undefined
    );
  }
}
