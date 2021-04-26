import { IdManager } from '@redhat-developer/vscode-redhat-telemetry/lib';
import { FileSystemIdManager } from '@redhat-developer/vscode-redhat-telemetry/lib/services/fileSystemIdManager';
import { CheIdManager } from './cheIdManager';

export namespace IdManagerFactory {

    export function getIdManager(): IdManager {
        if (process.env['CHE_WORKSPACE_ID']) {
            return new CheIdManager();
        }
        return new FileSystemIdManager();
    }

}