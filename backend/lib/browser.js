/** Browser-lib
 *  This module essentially encapsules the ZombieJS-Browser.
 *  When requiring this module, a Browser ist automatically launched and logs in into Facebook.
 *  Then requests can be sent to this browser for visiting urls.
 */
var fs = require("fs");
var async = require("async");
var Zombie = require("zombie");
var r = require("redis");
var redis = r.createClient();
var request = require('request');
var FileCookieStore = require('tough-cookie-filestore');
var cookieJar = request.jar(new FileCookieStore('cookies.json'));
request = request.defaults({jar: cookieJar})

var WORKERS = 5
// in miliseconds, google: one week in seconds
var EXPIRETIME = 604800 * 1000

//The browser instance
var worker = []
var workQueue = []

// for more results
var headernextencoded;

//Exported module functions
exports.init = initModule;
exports.get = cachedReadPage;
exports.shutdown = shutdownModule;

function initModule(callback) {
    //Initialization
    Zombie.localhost('https://www.facebook.com')


    //start five browsers
    startBrowser(function (err, browser) {
        if (err)
            return callback(err)

        //populate worker-pool
        worker.push(browser)
        for (var c = 1; c < WORKERS; ++c)
            worker.push(browser.fork()) //Create an independent browser copy (already logged in)

        callback()
    })
}

function shutdownModule() {
    if (browser)
        browser.close();
}

// function cookieCallback(err,res) {
//   if (err)
//     console.log(err)

// }

/** This function creates a browser, logs it in into facebook and then
 *  returns the browser to the callback after the login has completed
 */
function startBrowser(callback) {
    var browser = Zombie.create();

    if (fs.existsSync("./cookies.tmp")) {
        console.log("Loading cookies from file...") //And omitting login
        fs.readFile("./cookies.tmp", function (err, cookies) {

            browser.loadCookies(cookies.toString())
            browser.visit("/", function (e) { //Browser must visit a page
                return callback(e, browser)
            })
        })
    } else { //Default login procedure
        async.series([
            function (cb) {
                browser.visit('/login.php', cb);
            },
            function (cb) {
                //browser.fill('email', 'haw-mi@wegwerfemail.de');
                browser.fill("email", "haw-mi-2@wegwerfemail.de")
                browser.fill('pass', 'geheim123');
                browser.pressButton('login', cb);
            }],
                function (err, data) {
                    if (err)
                        return callback(err);


                    // TODO: write cookies to cookieJar here

                    // for (var i = 0; i < browser.cookies.length; i++) {
                    //   var tmp = browser.cookies[i]
                    //   tmp = String(tmp)
                    //   console.log(tmp.substring(0,tmp.indexOf(";")));
                    //   cookieJar.setCookie(tmp.substring(0,tmp.indexOf(";")), 'facebook.com',cookieCallback);
                    // }

                    //Save cookies and return new browser

                    var cookies = browser.saveCookies()
                    fs.writeFile("./cookies.tmp", cookies, function () {
                        return callback(null, browser); //Return the browser, which is ready to make requests
                    })

                }
        )
    }
}

function cachedReadPage(url, callback) {

    redis.get(url, function (err, reply) {
        if (err)
            return callback(err)

        if (reply)
            return callback(null, JSON.parse(reply))

        readPage(url, function (err, result) {
            //Don't enter value if an error occurred
            if (err)
                return callback(err)
            //Enter 'url' -> 'result' into Redis
            redis.set(url, JSON.stringify(result), function (err, reply) {
                if (err)
                    return callback(err)
                redis.expire(url, EXPIRETIME, function (err, reply) {
                    if (err)
                        return callback(err)
                })
            })
            return callback(null, result)
        })
    })
}

/** Open a Facebook url and then return the page's content by the callback.
 *
 * internally this adds a job-entry to the workQueue and wakes a an idle worker if available.
 */
function readPage(url, callback) {
    workQueue.push({url: url, callback: callback})

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
        browser.visit(job.url, {duration: "20s"}, function (err, data) {
            if (err)
                process.nextTick(function () {
                    job.callback(err)
                })
            else {
                //The result must be bound here, referencing browser from inside the function is invalid
                var data = convertPageToJSON(browser)
                process.nextTick(function () {
                    job.callback(null, data)
                })
            }

            //Job done, check for remaining work
            process.nextTick(function () {
                work(browser)
            })
        })
    } else {
        worker.push(browser) //All jobs done, set browser to idle
    }
}


function convertPageToJSON(browser) {

    // obviously, it can't be run like this.
    //runScraping(browser.html());

    var people = []
    var peopleDivs = []

    if (!browser.query("#BrowseResultsContainer")) //No results were found
        return []


    var foldBelow = browser.query("#u_0_o_browse_result_below_fold") || browser.query("#u_jsonp_2_2_browse_result_below_fold")

    // People are returned in two seperate div containers. The first one is loaded statically
    // and sometimes contains only one elment and the second one is loaded dynamically and contains the remaining people
    array_copy(browser.query("#BrowseResultsContainer").childNodes, peopleDivs)
    array_copy(foldBelow.childNodes, peopleDivs)

    peopleDivs.forEach(function (child) {

        var person = {}
        var link = child.querySelector("._zs.fwb > a")
        var img = child.querySelector("._7kf._8o._8s.lfloat._ohe > img")

        person.name = link.textContent
        person.id = extractUserId(link.href)
        person.pictureurl = img.src

        // subtitle and the 4 snippets
        divClasses = ["._pac._dj_",
            "div[data-bt*=snippets] ._ajw:nth-of-type(1) ._52eh",
            "div[data-bt*=snippets] ._ajw:nth-of-type(2) ._52eh",
            "div[data-bt*=snippets] ._ajw:nth-of-type(3) ._52eh",
            "div[data-bt*=snippets] ._ajw:nth-of-type(4) ._52eh"]

        // for every element: in case element exists
        for (var i = 0; i < divClasses.length; i++) {
            if (child.querySelector(divClasses[i]) != null) {
                // extract information through regex
                returnArray = extractInformationFromDiv(child.querySelector(divClasses[i]).textContent);
                if (returnArray != null && returnArray.length != 0) {
                    for (var j = 0; j < returnArray.length; j++) {
                        // trim() removes white spaces at beginning and end
                        person[returnArray[j][0]] = returnArray[j][1].trim();
                    }
                }
            }
        }
        people.push(person)
    })

    return people
}


function extractInformationFromDiv(rawDivs) {
// regex101.com ftw
    regexArray = [
        ['gender', /(female)(?!s)/gmi],
        ['gender', /\s(male)(?!s)/gmi],
        ['age', /(\d)years\sold/i],
        ['lives', /Lives\sin\s(.*)/i],
        ['from', /.*From\s(.*)/i],
        ['university', /(?=Studie[s|d]).*at\s(.*)/gmi],
        ['employer', /^(?!Studie[s|d]).*\sat(.*)/gmi],
        ['studies', /(?=Studie[s|d]\s)Studie[s|d]\s(.*)\sat.*/gmi],
        ['relationship', /(Single)/i],
        ['relationship', /(In\sa\srelationship).*/i],
        ['relationship', /(Open\srelationship).*/i],
        ['relationship', /(Engaged).*/i],
        ['relationship', /(Widowed).*/i],
        ['relationship', /(Civil Union).*/i],
        ['relationship', /(Complicated).*/i],
        ['relationship', /(Divorced).*/i],
        ['relationship', /(Dating).*/i],
        ['relationship', /(Seperated).*/i],
        ['language', /Speaks\s(.*)/i]
    ]

    //  in case there is a ·, split strings first
    divs = []
    if (rawDivs.indexOf("·") != -1) {
        divs = splitStrings(rawDivs)
    } else {
        divs.push(rawDivs)
    }

    // interate through all the regexes and give back an array
    // with the json attribute name and the value
    returnArray = []
    for (var i = 0; i < regexArray.length; i++) {

        for (var j = 0; j < divs.length; j++) {
            //regexArrax[i][1] ist the regex to test
            if (regexArray[i][1].test(divs[j])) {

                // prepare for return this to convertPageToJSON
                tmpArray = []
                tmpArray.push(regexArray[i][0])
                // I have no idea why, but unless this is executed
                // I get "Cannot read property '1' of null"
                regexArray[i][1].exec(divs[j])
                // exec returns an array->[1] is the desired value
                tmpArray.push(regexArray[i][1].exec(divs[j])[1])

                returnArray.push(tmpArray)
            }
        }
    }
    return returnArray;
}

function splitStrings(divLine) {
    // remove all white spaces and split by the middle point
    return divLine.split("·")
}

function extractUserId(url) {
    // extracts the facebook user id from URL
    var pattern = /https:\/\/www\.facebook\.com\/(.*)[?].*/i
    return pattern.exec(url)[1];
}

function array_copy(from, to) {
    for (var c = 0; c < from.length; ++c)
        to.push(from[c])
}

// copied from https://github.com/sergerehem/fb-uid-scraper/blob/master/scripts/script.js
// this is the old version. easier to understand and should still work
// the helper functions didn't change
// the code needs some serious refactoring though

// this is where it starts
function runScraping(htmlreload) {

    // this might be unnecessary
    //getData(url, function (htmlreload) {
    headernextencoded = SubstringHeaderNext(htmlreload);
    var urlNextPage = cutNextUrl(htmlreload);
    console.log("urlNextPage: " + urlNextPage)
    getData(urlNextPage, showNext_callback, function () {
        console.log("load next data error");
    });

    // }, function () {
    //      console.log("load data error");
    //  });
}

function showNext_callback(htmlnext) {
    var htmldoc = SubString({invl: htmlnext, startvl: 'payload":"', addstartindex: 'payload":"'.length, endvl: 'jsmods', addendindex: -3});

    console.log("htmldoc.length: " + htmldoc.length)
    if (htmldoc.length > 0) {

        var htmldecoded = DecodeEncodedNonAsciiCharacters(htmldoc).replace(/\\\"/g, "'").replace(/\\/g, '');
        //console.log("f1=" + htmldecoded.indexOf('\\\"'));
        //console.log("f2=" + htmldecoded.indexOf('\"'));
        //console.log("f3=" + htmldecoded.indexOf('\\'));

        //console.log(htmldecoded);
        //selectData(htmldecoded); // deleted, this was just for the chrome plugin
        footernext = SubstringFooterNext(htmlnext);
        if (footernext.length <= 0) {
            return;
        }
    }
    else {
        return
        //callback()
    }
    // recursive because getData will call showNext_callback
    var urlNextPage = cutNextUrl(htmlnext);
    getData(urlNextPage, showNext_callback, function () {
        console.log("load next data error");
    });
}

//--- the following are just helper functions

// replaces every "\uXXXX" encoded character with the actual char
function DecodeEncodedNonAsciiCharacters(x) {

    var r = /\\u([\d\w]{4})/gi;
    x = x.replace(r, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });
    x = unescape(x);
    return x;
}

// cuts outs pieces, depening on the parameter _para, see SubstringFooterNext and SubstringHeaderNext
function SubString(_para) {
    var _return = '';
    var startindex = _para.invl.indexOf(_para.startvl);
    if (startindex > -1) {
        startindex += _para.addstartindex;
        var endindex = -1;
        if (_para.endvl.length > 0 && (endindex = _para.invl.indexOf(_para.endvl, startindex)) > startindex) {
            endindex += _para.addendindex;
            _return = _para.invl.substring(startindex, endindex);
        }
        else {
            _return = _para.invl.substring(startindex);
        }
    }
    return _return;
}

function SubstringFooterNext(htmlreload) {
    return SubString({invl: htmlreload, startvl: '"cursor":', addstartindex: 0, endvl: '}', addendindex: 1});
}

function SubstringHeaderNext(htmlreload) {
    return SubString({invl: htmlreload, startvl: '{"view":"list"', addstartindex: 0, endvl: 'story_id":', addendindex: 0}) + 'story_id":null';
}

function cutNextUrl(htmlreload) {
    var footernext = SubstringFooterNext(htmlreload);
    return 'https://www.facebook.com/ajax/pagelet/generic.php/BrowseScrollingSetPagelet?data=' + headernextencoded + ',' + footernext + '&__a';
}

// instead of using jQuery, this function now uses mikaels request
function getData(link, onSuccess, onError) {

    console.log("getData URL: " + link);

    // need the cookies here to make the next request
    var options = {
        url: link,
        // is already default, just ot make it clear
        jar: cookieJar,
        method: 'GET'
    }

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            onSuccess(body);
        } else {
            onError(error)
        }
    })
}
