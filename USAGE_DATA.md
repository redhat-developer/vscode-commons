## Usage data being collected by Red Hat Extensions
Only anonymous data is being collected by Red Hat extensions leveraging Red Hat Commons' facilities. The IP address of telemetry requests is not even stored on Red Hat servers.

### Common data
Telemetry requests may contain:

* a random anonymous user id (UUID v4), that is stored locally on `~/.redhat/anonymousId`
* the client name (VS Code, VSCodium, Eclipse Che...) and its version
* the name and version of the extension sending the event (eg. `fabric8-analytics.fabric8-analytics-vscode-extension`)
* the OS name and version (and distribution name, in case of Linux)
* the user locale (eg. en_US)
* the user timezone
* the country id ( as determined by the current timezone)

Common events are reported:

* when extension is started
* when extension is shutdown
    - duration of the session

The implementation of telemetry collection can be found in https://github.com/redhat-developer/vscode-redhat-telemetry 

### Other extensions
Red Hat extensions' specific telemetry collection details can be found there:

* [Dependency Analytics](https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/blob/master/Telemetry.md)
* [OpenShift Connector](https://github.com/redhat-developer/vscode-openshift-tools/blob/master/USAGE_DATA.md)
* [Project Initializer](https://github.com/redhat-developer/vscode-project-initializer/blob/master/USAGE_DATA.md)
* [Remote Server Protocol](https://github.com/redhat-developer/vscode-rsp-ui/blob/master/USAGE_DATA.md)
