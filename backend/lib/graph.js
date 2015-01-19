var graph = require('fbgraph');
var async = require("async")
var request = require("request")
var redis = require("redis")
var fs = require("fs")
var rc = redis.createClient()

// Exported functions
exports.getIdFromName = getIdFromName
exports.getIdFromLocation = getIdFromLocation
exports.getIdFromLanguage = getIdFromLanguage
exports.getPictureFromID = getPictureFromID
exports.getProfilePicturesFromIds = getProfilePicturesFromIds
exports.getProfilePictureFromId = getProfilePictureFromId

//Unser altes App-Token
var accessToken = 'CAACEdEose0cBAEwMPBeoZBRi3LD0ZCUiH3uW5TY32xAHwrgRzL5MPlyB8hcjZC7KqKDF6wAQUPK7W8TbsstH11K6xpFZBnevyjV3ZA8ZBlZCx6K9gIqHLnRfXjJqqdSZBFlfKCfABfEf8rOZA5CkP2Cp7LBFRYa61xZAoBIEtpALci2eIOz7SBHDkLge57z3rzTXdFwz2QKTRXwKZCzhEMTiAOz8mCWzdfFZCEsZD'
if (fs.existsSync("accessToken.tmp"))
  accessToken = fs.readFileSync("accessToken.tmp", {encoding:"utf8"})
graph.setAccessToken(accessToken)

/** A generic method to query the facebook graph for a certain ID
 */
function lookupData(name, callback) {
    var searchOptions = {
        q: name,
        type: 'page'
    };

    graph.search(searchOptions, function(err, res) {
        if (err)
            return callback(err)

        if (res.data.length > 0)
            return callback(null, res);
        return callback("No matching ID found for: '" + name + "'!")
    });
}


/** Resolves a name to the first ID it finds
 */
function getIdFromName(name, callback) {
    lookupData(name, function(err, res) {
        if (err)
            return callback(err)

        //if everything went well, return first ID
        return callback(null, res.data[0].id)
    })
};


/** Helper function for implementing getIdFromLocation()
 */
function array_findFirst(ary, predicate) {
    for (var c = 0; c < ary.length; ++c)
        if (predicate(ary[c]))
            return ary[c]
    return undefined
}

function array_contains(ary, predicate) {
    return array_findFirst(ary, predicate) != undefined
}

/** This resolves the given location name into an ID
 *  It only accepts IDs of the category City, Country, State, Landmark
 *
 */
function getIdFromLocation(location, callback) {
    lookupData(location, function(err, res) {
        if (err)
            return callback(err)

        var locationObject = array_findFirst(res.data, function(element) {
            if (element.category_list != undefined)
                return array_contains(element.category_list, function(entry) {
                    return entry.name == "City" ||
                        entry.name == "Country" ||
                        entry.name == "State" || //eg. Florida
                        entry.name == "Landmark" //eg. Africa
                })
            return false
        })

        if (!locationObject)
            return callback("Couldn't map location: '" + location + "' to an ID corresponding to a city, a country, a state or a landmark")
        callback(null, locationObject.id)
    })
}


/** This resolves the given langauge into an ID
 */
function getIdFromLanguage(lang, callback) {
    lookupData(lang, function(err, res) {
        if (err)
            return callback(err)

        var language = array_findFirst(res.data, function(element) {
            return element.category == "Language"
        })

        if (!language)
            return callback("Couldn't map language name: '" + lang + "' to an ID corresponding to a language")
        callback(null, language.id)
    })
}

function getPictureFromID(fbID, callback) {
    graph.get("/" + fbID + "/picture", function(err, res) {
        if (err)
            return callback(err)
                // sic
        callback(null, res.location)
    });
}

function getProfilePictureFromId(id, callback) {
    getProfilePicturesFromIds([id], callback)
}

function getProfilePicturesFromIds(ids, callback) {
    async.map(ids, getIdFromUsernameCache, function(e, r) {
        var requests = r.map(function(id) {
            return {
                method: "GET",
                relative_url: id + "/picture?width=2000&redirect=false"
            }
        })

        return graph.batch(requests, function(e, r1) {
            if (e) return callback(e, null)
            r1 = r1.map(function(elem, index) {
                if (JSON.parse(elem.body).error) {
                    e = JSON.parse(elem.body).error
                }

                var url = (JSON.parse(elem.body).data) ?
                    JSON.parse(elem.body).data.url : null
                return {
                    "url": url,
                    "id": ids[index]
                }
            })
            return callback(null, r1)
        })
    })
}

function getIdFromUsername(username, callback) {
    request({
        url: 'https://graph.facebook.com/' + username,
        json: true
    }, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(null, body.id)

        } else {
            callback(error, null)
        }
    })
}

function getIdFromUsernameCache(username, callback) {
    rc.hget("fbid", username, function(err, reply) {
        if (!reply) {
            return getIdFromUsername(username, function(e, r) {
                rc.hset("fbid", username, JSON.stringify(r))
                return callback(e, r)
            })
        } else {
            return callback(null, JSON.parse(reply))
        }
    })
}

/** Function to extend the duration of the access token.
 *  At the moment this is not needed
 */
function extendAccessToken(callback) {
    graph.extendAccessToken({
        "client_id": "736322176438280",
        "client_secret": "b15e0263baa65d34312aaf3a0ad8bc44"
    }, callback)
}
