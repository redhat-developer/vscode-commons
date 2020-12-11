import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import {v4 as uuid } from 'uuid';
import { Logger } from './logger';

let REDHAT_ANONYMOUS_UUID : string | undefined;

export namespace UUID {
  export function getRedHatUUID() {
    if (REDHAT_ANONYMOUS_UUID) {
      return REDHAT_ANONYMOUS_UUID;
    }

    const homedir = os.homedir();
    const redhatDir = path.join(homedir, '.redhat');
    const redhatUUIDFilePath = path.join(redhatDir, 'anonymousId');
    try {
      if (fs.existsSync(redhatUUIDFilePath)) {
        const contents = fs.readFileSync(redhatUUIDFilePath, {encoding: 'utf8'});
        if (contents) {
          REDHAT_ANONYMOUS_UUID = contents.trim();
        }
      }
      if (REDHAT_ANONYMOUS_UUID) {
        Logger.log(`loaded Red Hat UUID: ${REDHAT_ANONYMOUS_UUID}`);
      } else {
        Logger.log('No Red Hat UUID found');
        REDHAT_ANONYMOUS_UUID = uuid();
        if (!fs.existsSync(redhatDir)){
          fs.mkdirSync(redhatDir);
        }
        fs.writeFileSync(redhatUUIDFilePath, REDHAT_ANONYMOUS_UUID, {encoding: 'utf8'});
        Logger.log(`Written Red Hat UUID: ${REDHAT_ANONYMOUS_UUID} to ${redhatUUIDFilePath}`);
      }
    } catch (e) {
      Logger.log('Failed to access Red Hat UUID: '+e.message);
    }
    return REDHAT_ANONYMOUS_UUID!;
  }
}
