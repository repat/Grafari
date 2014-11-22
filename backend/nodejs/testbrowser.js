var Browser = require("./lib/browser");

console.log("Launching system");

//First initialize browser-module
Browser.init(function(err, d) {
    if (err) {
        console.log("Error: " + JSON.stringify(err));
        throw "Browser init failed";
    }
    console.log("Browser initialized");
    Browser.startRest();
});