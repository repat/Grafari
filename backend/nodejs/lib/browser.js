/** Browser-lib 
 *  This module essentially encapsules the ZombieJS-Browser.
 *  When requiring this module, a Browser ist automatically launched and logs in into Facebook.
 *  Then requests can be sent to this browser for visiting urls.
 */ 
var async = require("async");
var restify = require('restify');
var Zombie = require("zombie");
var graph = require('./graph.js');
var Requests = require("./request-logic")

var browser = undefined; //will be initialized in init()-function

//Exported module functions
exports.init = initModule;
exports.get = readPage;
exports.shutdown = shutdownModule;
exports.startRest = startRest;


function initModule(callback) {
  //Initialization
  Zombie.localhost('https://www.facebook.com')
  startBrowser(function(err, data) {
    if (err)
      return callback(err);

    browser = data;
    callback();
  });
}

function startRest() {
  var server = restify.createServer({
    name: 'Grafari'
  });
  server.get('/search/:str', search);
  server.head('/search/:str', search);

  server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
  });
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
  async.series([
    function(cb) {
      browser.visit('/login.php', cb);
    },
    function(cb) {
      browser.fill('email', 'haw-mi@wegwerfemail.de');
      browser.fill('pass', 'geheim123');
      browser.pressButton('login', cb);  
    }], 

    function(err, data) {
      if (err)
        return callback(err);

      return callback(null, browser); //Return the browser, which is ready to make requests
    });
}

/** Open a Facebook url and then return the page's content by the callback.
 */
function readPage(url, callback) {
  //TODO mark browser as busy
  //TODO use browser-pool
  //TODO cache results
  browser.visit(url, function(err, data) {
    if (err)
      return callback(err);

    callback(null, browser.text('title'));
  })
}

/** searches for people by Cityname
 */
function search(req, res, next) {

  var str = '';
  var input = '';

  /** Ich kann in der Rest URL keine Leerzeichen übergeben, deshalb habe ich die Strings von David einfach durchnummeriert.
  */
  switch(req.params.str) {
    case '1':
      input = 'All people who are living in Germany';
      break;
    case '2':
      input = 'All women who are under 20 years old';
      break;
    case '3':
      input = 'All women who are younger than 20 OR all men who are older than 20';
      break;
    case '4':
      input = 'All women who (live in Germany OR live in America)';
      break;
    case '5':
      input = 'Women who are between 20 and 30 years old AND like 4Chan';
      break;
    case '6':
      input = 'women who like "Justin Bieber" AND are under 20 years old AND live in "Hamburg, Germany"';
      break;
    case '7':
      input = 'All people who live in Germany AND (are under 23 years old OR are older than 17) AND (like "Who Am I" OR are named "Bob")';
      break;  
  };

  console.log("---\nsearch");
  console.log('query: ' + input);

  var parseTree = Requests.parse(input);
  console.log("Flattened Parse-Tree:\n" + parseTree.toString() + "\n");

  async.series([
    function(cb) {
      Requests.translateTree(parseTree, function(err, requestList) {
        console.log("Resolved into following requests:");
        requestList.forEach(function (request) {
          console.log(request);
          str += request;
        });
        cb();
      });
    },
    function(cb) {
      browser.visit('https://www.facebook.com/search' + str)
      .done(function() {
        console.log('result: ' + browser.text('title'));
        res.send('result: ' + browser.text('title'));
        cb();

        // fs.writeFile('test.html', browser.html('#browse_result_area'), function(err) {
        //   if (err) 
        //   return console.log(err);
        //   console.log('Ergebnis in Datei gespeichert');
        //   cb();
        // });

      });
    },
    function() {
      console.log('done!');
      next();
    }
  ]);
}