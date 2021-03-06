var path = require("path");
var shelljs = require("shelljs");

module.exports = function (logger, platformsData, projectData, hookArgs) {
    if (!projectData.$options.argv.bundle) {
        return;
    }

    var projectDir = projectData.projectDir;
    var platform = hookArgs.platform.toLowerCase();
    process.env.PLATFORM = platform;

    var platformData = platformsData.getPlatformData(platform);
    var platformOutDir = platformData.appDestinationDirectoryPath;
    var platformAppDir = path.join(platformOutDir, "app");
    process.env.PLATFORM_DIR = platformOutDir;

    var bundler = require("nativescript-dev-webpack");

    var pluginWebPackBinary = path.join(__dirname, "node_modules", ".bin", "webpack");
    var projectWebPackBinary = path.join(projectDir, "node_modules", ".bin", "webpack");
    var webPackBinary = projectWebPackBinary;
    if (shelljs.test("-f", pluginWebPackBinary)) {
        webPackBinary = pluginWebPackBinary;
    }

    return new Promise(function (resolve, reject) {
        var webPackCommand = webPackBinary;
        if (process.env.WEBPACK_OPTS) {
            webPackCommand += " " + process.env.WEBPACK_OPTS;
        }
        return shelljs.exec(webPackCommand, function(code, output) {
            if (code === 0) {
                var appJson = bundler.readPackageJson(platformAppDir);
                var bundleRelativePath = path.relative(platformOutDir, bundler.getBundleDestination("./app"));
                appJson.main = path.basename(bundleRelativePath);
                bundler.writePackageJson(platformAppDir, appJson);

                resolve();
            } else {
                console.log('Webpack bundling failed.');
                reject();
            }
        });
    });
};
