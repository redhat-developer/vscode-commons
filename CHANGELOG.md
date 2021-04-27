# Change Log

All notable changes to the "vscode-commons" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 0.0.6 - 2021-04-26
- don't sanitize non-string, non-object properties

## 0.0.5 - 2021-04-26
- userId is now sent instead of anonymousId
- username is scrubbed off of event properties
- should send Che userId, when newest Theia is used and vscode-commons doesn’t run in sidecar
