import * as vscode from 'vscode';
import * as publicIp from 'public-ip';
import * as fs from 'fs';
import * as path from 'path';
import Analytics from 'analytics-node';
import { TelemetryEvent } from './TelemetryEvent';
import { Logger } from './Logger';

let analytics: Analytics | undefined;
let cachedIp: string | undefined;

// For now, write to file instead of sending to segment
let stream: fs.WriteStream;
const filename: string = 'file.txt';

// file will be located inside the out/ folder
const pathToFile: string = path.join(__dirname, filename);

export namespace Reporter {

  export function initialize(context: vscode.ExtensionContext) {
    const writeKey: string | undefined = getSegmentWriteKey(context);
    if (writeKey) {
      analytics = new Analytics(writeKey, { flushAt: 1 });
      Logger.log('Analytics created');
    } else {
      vscode.window.showWarningMessage('Missing segmentWriteKey from package.json');
    }
    

    // For now, write to file instead of sending to segment
    if (fs.existsSync(pathToFile)) {
      fs.unlinkSync(pathToFile); // delete file
    }
    stream = fs.createWriteStream(pathToFile, { flags: 'a' });
  }

  export function report(e: TelemetryEvent): void {
    if (isConnected()) {
      Logger.log('Tracking ' + e.name);
      getIp().then((ip: string) => {

        Logger.log(`IP is: ${ip}`);
        Logger.log('Here is where data is sent to segment');
        Logger.log('The following event is to be sent:');
        Logger.log(JSON.stringify(e));

        // For now, write to file instead of sending to segment
        stream.write(JSON.stringify(e, null, 4) + '\n\n');

        // (analytics as Analytics).track({
        //   anonymousId: vscode.env.machineId || 'vscode.developer',
        //   event: e.name,
        //   //timestamp: (e.timestamp)?new Date(e.timestamp).t:null,
        //   properties: (e.properties) ? e.properties : e.measures,
        //   context: { ip: ip }
        // }, function (err: Error, batch) {
        //   if (err) {// There was an error flushing data...
        //     console.log(err);
        //   } else if (batch) {
        //     console.log(batch);
        //   }
        // });
      });
    }
  }

  export function isConnected() {
    return typeof analytics !== 'undefined' && analytics !== null;
  }
}

function getSegmentWriteKey(context: vscode.ExtensionContext): string | undefined {
  let extensionPackage = require(context.asAbsolutePath('./package.json'));
  if (extensionPackage) {
    Logger.log(`Found package.json. segmentWriteKey is: ${extensionPackage.segmentWriteKey}`);
    return extensionPackage.segmentWriteKey;
  }
  Logger.log(`Could not find package.json`);
  return undefined;
}

function getIp(): Thenable<string> {

  if (cachedIp) {
    return Promise.resolve(cachedIp);
  }

  return publicIp.v4({ https: true }).then((publicIp: string) => {
    Logger.log('Public IP address is ' + publicIp);
    cachedIp = publicIp;
    return Promise.resolve(cachedIp);
  }).catch(err => {
    Logger.log('Failed to determine public IP: ' + err.message);
    return Promise.resolve('127.0.0.1');
  });
}