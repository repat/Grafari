/** Browser-lib 
 *  This module essentially encapsules the ZombieJS-Browser.
 *  When requiring this module, a Browser ist automatically launched and logs in into Facebook.
 *  Then requests can be sent to this browser for visiting urls.
 */ 
var Zombie = require("zombie")
var async = require("async")

var browser = undefined //will be initialized in init()-function

//Exported module functions
exports.init = initModule
exports.get = readPage
exports.shutdown = shutdownModule


function initModule(callback) {
  //Initialization
  Zombie.localhost('https://www.facebook.com')
  startBrowser(function(err, data) {
    if (err)
      return callback(err)

    browser = data
    callback()
  })
}


function shutdownModule() {
  if (browser)
  browser.close()
}

/** This function creates a browser, logs it in into facebook and then 
 *  returns the browser to the callback after the login has completed
 */
function startBrowser(callback) {
  var browser = Zombie.create()
  async.series([
    function(cb) {
      browser.visit('/login.php', cb)
    },
    function(cb) {
      browser.fill('email', 'haw-mi@wegwerfemail.de')
      browser.fill('pass', 'geheim123')
      browser.pressButton('login', cb)  
    }], 

    function(err, data) {
      if (err)
        return callback(err)

      return callback(null, browser) //Return the browser, which is ready to make requests
    })
}

/** Open a Facebook url and then return the page's content by the callback.
 */
function readPage(url, callback) {
  //TODO mark browser as busy
  //TODO use browser-pool
  //TODO cache results
  browser.visit(url, function(err, data) {
    if (err)
      return callback(err)

    callback(null, browser.text('title'))
  })
}