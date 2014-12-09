/** Main entry point for our backend application.
 *  Usage: node main.js [port]
 */

var restify = require('restify')
var async   = require("async")
var Browser = require("./lib/browser")
var Requests = require("./lib/request-logic")
var fs = require('fs');

//Use 8080 for testing
var port = 8080
var securePort = 8443
if (process.argv.length > 2) 
  port = parseInt(process.argv[2])

var httpsOptions = {
  name: "Secure Grafari",
  key: fs.readFileSync('./keys/grafari.key'),
  certificate: fs.readFileSync('./keys/grafari.crt')
};

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

  server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
  });

  var httpsServer = restify.createServer(httpsOptions);
  httpsServer.get('/search/:str', search);
  httpsServer.head('/search/:str', search);

  httpsServer.listen(securePort, function() {
    console.log('%s listening at %s', httpsServer.name, httpsServer.url);
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
    var lookupFunctions = requestList.map(function (request) {
      return function(callback) {
        console.log("Fetching: " + request.url)
        Browser.get("/search" + request.url, function(err,ary) {
          if (err)
            return callback(err)
          return callback(null, {
            "url":request.url,
            "query":request.query,
            "results":ary
          })
        })
      }
    })

    //Execute requests
    async.parallel(lookupFunctions, function(err, jsonArray) {
      if (err)
        return handleError(err, res, done)

      console.log("Sending response")

      res.header("Access-Control-Allow-Origin", "*");
      res.charSet('utf-8');
      res.send(mergeResults(jsonArray))
      return done()      
    })
  })
}

function handleError(err, res, done) {
  console.log("An error ocurred: \n" + JSON.stringify(err))
  res.send({"Internal error" : err})
  return done()
}


function mergeResults(jsonData) {
  var results = [{ type:"subqueries" }]
  var queries = []   //List of all subqueries

  var personMap = {} //Map ID -> person
  var people = []    //List of all people ids

  //For every query
  jsonData.forEach(function(queryData) {
    var qid = queries.length
    queries.push(queryData.query)

    //For every person in that query
    queryData.results.forEach(function(person) {
      if (personMap[person.id]) { //Person already known from other query
        //TODO merge properties (If query a returned other attributes for that person than query b)
        personMap[person.id].subqueries.push(qid)
      } else {
        person.subqueries = [ qid ]
        personMap[person.id] = person
        people.push(person.id)
      }
    })
  })

  //Copy queries into first result object
  for(var c = 0; c < queries.length; ++c)
    results[0][c] = queries[c]

  results[0].length = queries.length

  //Now append all people
  people.forEach(function(pid) {
    results.push(personMap[pid])
  })

  return results
}