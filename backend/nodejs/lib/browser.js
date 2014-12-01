/** Browser-lib 
 *  This module essentially encapsules the ZombieJS-Browser.
 *  When requiring this module, a Browser ist automatically launched and logs in into Facebook.
 *  Then requests can be sent to this browser for visiting urls.
 */ 
var fs      = require("fs")
var async   = require("async");
var Zombie  = require("zombie");

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
    browser.visit(job.url, {duration:"20s"}, function(err, data) {
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
      process.nextTick(function() { work(browser) })
    })
  } else {
    worker.push(browser) //All jobs done, set browser to idle
  }
}


function convertPageToJSON(browser) {
  //
  // TODO: differentiate between works at, studies at, lives in, from, etc. (check wiki: Such Regex für Graph Search)
  //

  var people = []
  var peopleDivs = []
  
  // People are returned in two seperate div containers. The first one is loaded statically
  // and sometimes contains only one elment and the second one is loaded dynamically and contains the remaining people
  array_copy(browser.query("#BrowseResultsContainer").childNodes, peopleDivs)
  array_copy(browser.query("#u_0_o_browse_result_below_fold > div").childNodes, peopleDivs)


  peopleDivs.forEach(function(child) {
    var person = {}
    var link = child.querySelector("._zs.fwb > a")
    var img = child.querySelector("._7kf._8o._8s.lfloat._ohe > img")

    person.name = link.textContent
    person.id = extractUserId(link.href)
    person.pictureurl = img.src

    //TODO extract other attributes

    people.push(person)
  })

  console.log("Parsed " + people.length + " people in total")
  return people
}

function analyzeRegex(divs) {
  // TODO: hier rumbasteln und person objekt bauen, dann in convertPageToJSON mit person Objekt mergen
  // regular expressions, s. wiki
  var age = /(\d)years\sold/i
  var gender1 = /[^e]male[^s]/i
  var gender2 = /female[^s]/i
  var profession1 = /(.*)\sat.*/
  var employer1 = /Works\sat\s(.*)/i
  var employer2 = /.*\sat\s(.*)/i
  var lives1 = /Lives\sin\s(.*)/i
  var lives = /From\s(.*)/i
  // only present
  var university1 = /Goes\sto\s(.*)/i
  var university2 = /Studies\sat (.*)/i
  var university2 = /Studies\s.*\sat (.*)/i
  // just testing relationships
  var relationship1 = /Single/i
  var relationship2 = /In\sa\srelationship.*/i


  // check for empty strings first
  var person = {};
    // forEach nach ecma5+?
 /*   for(var i = 0; i < divs.length; i++) {
      subStrings = splitStrings(divs[i]);
      // analye them in sub-for-loop
        // person.attribute = subStrings[j];   
      }
   */   
  return person;
}

function splitStrings(divLine) {
  // remove all white spaces and split by the middle point
  return divLine.replace(/\s/g,"").split("·")
}

function extractUserId(url) {
  var pattern = /https:\/\/www\.facebook\.com\/(.*)[?].*/i
  return pattern.exec(url)[1];
}


function array_copy(from, to) {
  for(var c = 0; c < from.length; ++c)
    to.push(from[c])
}