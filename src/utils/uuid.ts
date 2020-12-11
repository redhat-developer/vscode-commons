import * as vscode from 'vscode';
export namespace UUID {
  export function getRedHatUUID() {
    return vscode.env.machineId || 'vscode.developer';
  }
}
