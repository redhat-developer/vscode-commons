import { IdManager } from '@redhat-developer/vscode-redhat-telemetry/lib';
import { FileSystemIdManager } from '@redhat-developer/vscode-redhat-telemetry/lib/services/fileSystemIdManager';

export namespace IdManagerFactory {

    export function getIdManager(): IdManager {
        return new FileSystemIdManager();
    }

}