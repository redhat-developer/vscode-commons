import { Logger } from './logger';
import Analytics from 'analytics-node';

export namespace SegmentInitializer {
  export function initialize(
    clientSegmentKey: string | undefined = undefined
  ): Analytics | undefined {
    const segmentWriteKey: string | undefined =
      clientSegmentKey || getDefaultSegmentWriteKey();

    if (segmentWriteKey) {
      /* 
        flushAt: Number ->  The number of messages to enqueue before flushing.
        flushInterval: Number ->    The number of milliseconds to wait before flushing the queue automatically.
        ref: https://segment.com/docs/connections/sources/catalog/libraries/server/node/#configuration
        */
      let analytics: Analytics = new Analytics(segmentWriteKey, {
        flushAt: 1,
        flushInterval: 10000,
      });
      return analytics;
    } else {
      Logger.log('Missing segmentWriteKey from package.json OR package.json in vscode-commons');
      return undefined;
    }
  }
}

function getDefaultSegmentWriteKey(): string | undefined {
  try {
    // tslint:disable-next-line: no-require-imports
    let extensionPackage = require('../../package.json');
    if (extensionPackage) {
      Logger.log(`default segmentWriteKey is: ${extensionPackage.segmentWriteKey}`);
      return extensionPackage.segmentWriteKey;
    }
    Logger.log(`Could not find vscode-commons/package.json`);
    return undefined;
  } catch (error) {
    Logger.log(`Error in getSegmentWriteKey`);
    return undefined;
  }
}
