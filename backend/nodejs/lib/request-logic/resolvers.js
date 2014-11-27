/** This module defines the resolver which is used to map from names 
 *  and locations to facebook IDs
 */
var fs = require("fs")

var CACHE_FILE = "id-cache.tmp"

module.exports = CachingGraphResolver


/** This resolver uses the GraphResolver to resolve ids and caches the results.
 *  Additionally the results are stored in a file to preserve the cache between restarts.
 */
function CachingGraphResolver() {
  this.resolver = new GraphResolver()

  this.lookupCache = {
    locations : {},
    ids : {}
  }

  if (fs.existsSync(CACHE_FILE)) {
    var cache = fs.readFileSync(CACHE_FILE)
    try {
      this.lookupCache = JSON.parse(cache)
      console.log("Loaded id cache from file.")
    } catch(e) {
      console.log(CACHE_FILE + " has an invalid JSON format, using blank cache.")
    }
  }
}

/**Used only for 'who live in X'
 * The ID returned must be of type city or country for Facebook to accept it
 *
 * @param location the location to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */
CachingGraphResolver.prototype.resolveLocation = function(location, callback) {
  var cache = this.lookupCache
  if (cache.locations[location]) {
    var id = cache.locations[location]
    return process.nextTick(function() { callback(null, id) })
  }

  //Ask resolver to resolve the id and store it in the cache
  this.resolver.resolveLocation(location, function(err, id) {
    if (err) 
      return callback(err)

    cache.locations[location] = id
    fs.writeFile(CACHE_FILE, JSON.stringify(cache))
    return callback(null, id)
  })
}


/** Used to generally resolve Names to ID's  (eg. for 'who like X')
 * 
 * @param what the item to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */ 
CachingGraphResolver.prototype.resolve = function(name, callback) {
  var cache = this.lookupCache
  if (cache.ids[name]) {
    var id = cache.ids[name]
    return process.nextTick(function() { callback(null, id) }) 
  }

  //Ask resolver to resolve the id and store it in the cache
  this.resolver.resolve(name, function(err, id) {
    if (err) 
      return callback(err)

    cache.ids[name] = id
    fs.writeFile(CACHE_FILE, JSON.stringify(cache))
    return callback(null, id)
  })
}



/** Resolver class using the lib/graph.js implementation to look up IDs
 */
function GraphResolver() {
  this.graph = require("../graph")
}

/**Used only for 'who live in X'
 * The ID returned must be of type city or country for Facebook to accept it
 *
 * @param location the location to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */
GraphResolver.prototype.resolveLocation = function(location, callback) {
  this.graph.getIdFromLocation(location, callback)
}

/** Used to generally resolve Names to ID's  (eg. for 'who like X')
 * 
 * @param what the item to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */ 
GraphResolver.prototype.resolve = function(what, callback) {
  this.graph.getIdFromName(what, callback)
}



/// ################### DummyResolver ###########################
// A mock class which just returns ID(elem) instead of a correct ID
function DummyResolver() {}

/**Used only for 'who live in X'
 * The ID returned must be of type city or country for Facebook to accept it
 *
 * @param location the location to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */
DummyResolver.prototype.resolveLocation = function(location, callback) {
  callback(null, "ID(" + location + ")")
}

/** Used to generally resolve Names to ID's  (eg. for 'who like X')
 * 
 * @param what the item to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */ 
DummyResolver.prototype.resolve = function(what, callback) {
  callback(null, "ID(" + what + ")")
}


//TODO implement a concrete resolver