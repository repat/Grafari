/** Main entry point for our backend application.
 */

var restify = require('restify')
var async   = require("async")
var Browser = require("./lib/browser")
var Requests = require("./lib/request-logic")
//var r   = require("redis")
//redis = r.createClient();


/** Start-Up (launch browser-module and rest server)
 */
console.log("Starting up...")
Browser.init(function(err) {
  if (err) {
    console.log("Browser initialization failed!\n" + JSON.stringify(err))
    throw "Browser initialization failed!"
  }

  var server = restify.createServer({
    name: 'Grafari'
  });
  server.get('/search/:str', search);
  server.head('/search/:str', search);

  server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
  });
})




/** Search in facebook using a given query and return resulting JSON
 */
function search(req, res, done) {
  var request = req.params.str
  console.log("Got Request: '" + request + "'")

  //Parse request
  var parseTree = Requests.parse(request)
  Requests.translateTree(parseTree, function(err, requestList) {
    var lookupFunctions = requestList.map(function (fbpath) {
      return function(callback) {
        /*redis.get(fbpath, function(err,reply) {
          if (reply == null) {
            // key doesn't exists
          } else {
            reply is json object
          }
        });*/
        console.log("Fetching: " + fbpath)
        Browser.get("/search" + fbpath, callback)
      }
    })

    //Execute requests
    async.parallel(lookupFunctions, function(err, jsonArray) {
      if (err)
        return handleError(err, res, done)

      console.log("Sending response")

      //TODO jsonArray must be correctly merged together before sending
      res.charSet('utf-8');
      res.send(jsonArray)
      return next()      
    })
  })
}

function handleError(err, res, done) {
  console.log("An error ocurred: \n" + JSON.stringify(err))
  res.send({"Internal error" : err})
  return done()
}
