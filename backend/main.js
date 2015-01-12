/** Main entry point for our backend application.
 *  Usage: node main.js [port]
 */

var restify = require('restify')
var async = require("async")
var Browser = require("./lib/browser")
var graph = require("./lib/graph")
var imgrec = require("./lib/imagerecognition")
var Requests = require("./lib/request-logic")
var fs = require('fs');

//Use 8080 for testing
var port = 8080
var securePort = 8443

var args = process.argv
args.shift() //node
args.shift() //main

while (args.length > 0) {
    var arg = args.shift()
    if (arg == "-debug") {
        Browser.debug = true
    } else { //port number
        port = parseInt(arg)
    }
}

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
    server.use(restify.bodyParser());
    server.use(restify.jsonp());

    server.get('/search/:str', search);
    server.head('/search/:str', search);
    server.get('/tags/id/:str', tags);
    server.head('/tags/id/:str', tags);
    server.post('/tags/id', tags);

    server.listen(port, function() {
        console.log('%s listening at %s', server.name, server.url);
    });

    var httpsServer = restify.createServer(httpsOptions);
    httpsServer.use(restify.bodyParser());
    httpsServer.use(restify.jsonp())

    httpsServer.get('/search/:str', search);
    httpsServer.head('/search/:str', search);
    httpsServer.get('/tags/id/:str', tags);
    httpsServer.head('/tags/id/:str', tags);
    httpsServer.post('/tags/id', tags);

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
        var lookupFunctions = requestList.map(function(request) {
            return function(callback) {
                console.log("Fetching: " + request.url)
                Browser.get("/search" + request.url, function(err, ary) {
                    if (err)
                        return callback(err)
                    return callback(null, {
                        "url": request.url,
                        "query": request.query,
                        "results": ary
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

function tags(req, res, done) {
    var ids = []

    if (req.method == 'POST') {
        var request = JSON.parse(req.body)
        ids = request.ids
    } else {
        var request = req.params.str
        ids = [request]
    }

    res.header("Access-Control-Allow-Origin", "*")
    res.charSet('utf-8')

    graph.getProfilePicturesFromIds(ids,
        function(err, result) {
            if (err) {
                return handleError(err, res, done)
            }

            url_list = result.map(function(e) {
                if (!e.hasOwnProperty('url'))
                    return e
                return e.url
            })

            async.map(url_list, imgrec.imageToTags, function(e, r) {
                if (e) {
                    return handleError(e, res, done)
                }

                a = {}
                r.forEach(function(e, index) {
                    a[result[index].id] = e.tags
                })
                res.send(a)
                return done()
            })
        }
    )
}

function handleError(err, res, done) {
    console.log("An error ocurred: \n" + JSON.stringify(err))
    res.send({
        "Internal error": err
    })
    return done()
}


function mergeResults(jsonData) {
    var results = {
        "users": []
    }
    var queries = [] //List of all subqueries

    var personMap = {} //Map ID -> person
    var people = [] //List of all people ids

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
                person.subqueries = [qid]
                personMap[person.id] = person
                people.push(person.id)
            }
        })
    })

    results.queries = queries

    //Now append all people
    people.forEach(function(pid) {
        results.users.push(personMap[pid])
    })

    return results
}