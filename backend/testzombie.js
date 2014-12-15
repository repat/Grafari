var Zombie = require("zombie")
var fs = require("fs")

Zombie.localhost('https://www.facebook.com')
var browser = Zombie.create();

exports.browser = browser

if (fs.existsSync("./cookies.tmp")) {
    console.log("Loading cookies from file...") //And omitting login
    fs.readFile("./cookies.tmp", function (err, cookies) {
        browser.loadCookies(cookies.toString())
        browser.visit("/search/males", function (e) { //Browser must visit a page
            if (e)
                console.log("Error while loading file: " + JSON.stringify(e))
            else
                console.log("Page loaded")
        })
    })
} else { //Default login procedure
    console.log("Missing cookie file")
}