/** Browser-lib 
 *  This module essentially encapsules the ZombieJS-Browser.
 *  When requiring this module, a Browser ist automatically launched and logs in into Facebook.
 *  Then requests can be sent to this browser for visiting urls.
 */ 
var fs      = require("fs")
var async   = require("async");
var Zombie  = require("zombie");
var cheerio = require('cheerio');

var WORKERS = 5

//The browser instance
var worker = []
var workQueue = []

//Exported module functions
exports.init = initModule;
exports.get = readPage;
exports.shutdown = shutdownModule;

function initModule(callback) {
  //Initialization
  Zombie.localhost('https://www.facebook.com')

  
  //start five browsers
  startBrowser(function(err, browser) {
    if (err)
      return callback(err)
    
    //populate worker-pool 
    worker.push(browser)
    for(var c = 1; c < WORKERS; ++c) 
      worker.push(browser.fork()) //Create an independent browser copy (already logged in)

    callback()
  })
}

function shutdownModule() {
  if (browser)
    browser.close();
}

/** This function creates a browser, logs it in into facebook and then 
 *  returns the browser to the callback after the login has completed
 */
function startBrowser(callback) {
  var browser = Zombie.create();
  
  if (fs.existsSync("./cookies.tmp")) {
    console.log("Loading cookies from file...") //And omitting login
    fs.readFile("./cookies.tmp", function(err, cookies) {
      browser.loadCookies(cookies.toString())
      browser.visit("/", function(e) { //Browser must visit a page
        return callback(e, browser)
      })
    })
  } else { //Default login procedure
    async.series([
      function(cb) {
        browser.visit('/login.php', cb);
      },
      function(cb) {
        //browser.fill('email', 'haw-mi@wegwerfemail.de');
        browser.fill("email", "haw-mi-2@wegwerfemail.de")
        browser.fill('pass', 'geheim123');
        browser.pressButton('login', cb);  
      }], 

      function(err, data) {
        if (err)
          return callback(err);

        //Save cookies and return new browser
        var cookies = browser.saveCookies()
        fs.writeFile("./cookies.tmp", cookies, function() {
          return callback(null, browser); //Return the browser, which is ready to make requests
        })
      }
    )
  }
}

/** Open a Facebook url and then return the page's content by the callback.
 * 
 * internally this adds a job-entry to the workQueue and wakes a an idle worker if available.
 */
function readPage(url, callback) {
  workQueue.push({url:url, callback:callback})

  if (worker.length > 0) { //wake up an idle browser
    var browser = worker.shift()
    console.log("Waking up a worker, " + worker.length + " worker left")
    work(browser)
  }
}

/** Internal function, which issues a browser to work until all jobs are completed
 */
function work(browser) {
  console.log("Checking workQueue: " + JSON.stringify(workQueue))
  if (workQueue.length > 0) {
    var job = workQueue.shift()
    browser.visit(job.url, function(err, data) {
      if (err)
        process.nextTick(function() { job.callback(err) })
      else {
        //The result must be bound here, referencing browser from inside the function is invalid
        var data = convertPageToJSON(browser)
        process.nextTick(function() { 
          job.callback(null, data) 
        })
      }
      
      //Job done, check for remaining work
      return work(browser)
    })
  } else {
    worker.push(browser) //All jobs done, set browser to idle
  }
}


function convertPageToJSON(browser) {
  //TODO read out the html (eg. browser.html('#browse_result_area'))
  //TODO build a JSON result structure.


  // for now, only names
  var $ = cheerio.load(browser.html());
  var nodelist = $('#browse_result_area').find('div[data-bt*=title]>a');
  var json = [];

  $(nodelist).each(function (i, elem) {
    json.push({});
    json[i].name = $(this).text().trim();
  });
  
  //console.log(json);
   
  return json
}