import * as vscode from "vscode";
import { Logger } from "./utils/logger";
import Analytics from "analytics-node";

export namespace SegmentInitializer {
  export function initialize(
    context: vscode.ExtensionContext
  ): Analytics | undefined {
    const segmentWriteKey: string | undefined = getSegmentWriteKey();

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
      vscode.window.showWarningMessage(
        "Missing segmentWriteKey from package.json"
      );
      return undefined;
    }
  }
}

function getSegmentWriteKey(): string | undefined {
  try {
    let extensionPackage = require("../package.json");
    if (extensionPackage) {
      Logger.log(
        `Found package.json. segmentWriteKey is: ${extensionPackage.segmentWriteKey}`
      );
      return extensionPackage.segmentWriteKey;
    }
    Logger.log(`Could not find package.json`);
    return undefined;
  } catch (error) {
    Logger.log(`Error in getSegmentWriteKey`);
  }
}
