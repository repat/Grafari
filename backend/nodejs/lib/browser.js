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
  //
  // TODO: differentiate between works at, studies at, lives in, from, etc. (check wiki: Such Regex für Graph Search)
  //

  var people = new Array();

  // first result (handeled differently, because its in a different div)
  var person = {};

  // name, pictureurl and id are set here
  person.name = browser.text('#u_0_p > div > div > div > div._zs.fwb > a');

  //TODO: fix person.id und person.pictureurl
  // funktioniert nicht, a und img sind null?
  //var a = browser.query('#u_0_p > div > div > div > div._zs.fwb > a');
  //person.id = extractUserId(a.getAttribute("href"));

  //var img = browser.query('#u_0_p > div > a > img')
  //person.pictureurl = img.getAttribute("src")

  var allTheDivs = [];

  // subtitle
  allTheDivs.push(browser.text('#u_0_p > div > div > div > div._pac._dj_'));
  // could be in a loop
  for (var i = 1; i < 5; i++) {
    allTheDivs.push(browser.text('#u_0_p > div > div > div > div._946 > div > div:nth-child(' +  i + ') > div'));
  }

  // debug
  // console.log(allTheDivs)

  // add all the other attributes (not sure about syntax here)
  // person = analyzeRegex(allTheDivs);
  // person will be created out of the results above and then pushed into final result
  people.push(person);


  // not changed to new parsing ideas (#22) yet
  // other results
  var rawHtml = browser.query('#u_0_o_browse_result_below_fold > div');
  // warum war vor childNodes ein _ (_childNodes)?
  for(var i = 0; i < rawHtml.childNodes.length; i++) {
    var index = i+1;  // i+1 inside the browser.text string doesn't work

    var person = {};

    // index begins at i = 0 (not variable index)
    var child = rawHtml.childNodes[i] 

    // name, pictureurl and id are set here
    person.name = browser.text('#u_0_o_browse_result_below_fold ._4_yl:nth-of-type(' + index + ') div[data-bt*=title] > a'); 
    //TODO: find the right img tag
    //console.log(browser.html('#u_0_o_browse_result_below_fold ._4_yl:nth-of-type(' + index + ') div[data-bt*=image] > img'));
    //person.pictureurl = "";
    //TODO: find the right a tag for the link to the profil, then give it to extractUserId()
    //person.id = "";

    allTheDivsFromOtherPeople = [];
      
    allTheDivsFromOtherPeople.push(child.querySelector('div[data-bt*=sub_headers] > a').innerText)
    
    for (var j = 1; j < 5; j++) {
      allTheDivsFromOtherPeople.push(child.querySelector('div[data-bt*=snippets] ._ajw:nth-of-type(' + j + ') ._52eh').text)
    }

    // debug
    // console.log(allTheDivsFromOtherPeople)

    // add all the other attributes (not sure about syntax here)
    //person = analyzeRegex(allTheOtherDivs);

    people.push(person);
  }

  // console.log('people:');
  // console.log(people);


  return people;
}

function analyzeRegex(divs) {
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