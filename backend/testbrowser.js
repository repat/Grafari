var Browser = require("./lib/browser")

/** Testscript für die browser-lib
 */

console.log("Launching system")

//First initialize browser-module
Browser.init(function (err, d) {
    if (err) {
        console.log("Error: " + JSON.stringify(err))
        throw "Browser init failed"
    }
    console.log("Browser initialized")

    //Open URL
    Browser.get("/search/males/20/users-older/intersect", function (e, content) {
        if (e) {
            console.log("Error: " + JSON.stringify(e))
            throw "Page load failed"
        }
        console.log("Read title: " + content)
        Browser.shutdown()
    })
})