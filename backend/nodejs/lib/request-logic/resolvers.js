/** This module defines the resolver which is used to map from names 
 *  and locations to facebook IDs
 */
var fs = require("fs")
var r = require("redis");
var redis = r.createClient();

var CACHE_FILE = "id-cache.tmp"

module.exports = RedisResolver

/// ################### CachingGraphResolver ###########################
/** This resolver uses the GraphResolver to resolve ids and caches the results.
 *  Additionally the results are stored in a file to preserve the cache between restarts.
 */
function CachingGraphResolver() {
  this.resolver = new GraphResolver()

  this.lookupCache = {
    locations : {},
    ids : {},
    langs : {}
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

/**Used only for 'who speak X'
 * The ID returned must be of type language for Facebook to accept it
 *
 * @param lang the language to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */
CachingGraphResolver.prototype.resolveLanguage = function(lang, callback) {
  var cache = this.lookupCache
  if (cache.langs[lang]) {
    var id = cache.langs[lang]
    return process.nextTick(function() { callback(null, id) })
  }

  //Ask resolver to resolve the id and store it in the cache
  this.resolver.resolveLanguage(lang, function(err, id) {
    if (err) 
      return callback(err)

    cache.langs[lang] = id
    fs.writeFile(CACHE_FILE, JSON.stringify(cache))
    return callback(null, id)
  })
}


/// ################### GraphResolver ###########################
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

/**Used only for 'who speak X'
 * The ID returned must be of type language for Facebook to accept it
 *
 * @param lang the language to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */
 GraphResolver.prototype.resolveLanguage = function(lang, callback) {
   this.graph.getIdFromLanguage(lang, callback)
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

/**Used only for 'who speak X'
 * The ID returned must be of type language for Facebook to accept it
 *
 * @param lang the language to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */
DummyResolver.prototype.resolveLanguage = function(lang, callback) {
  callback(null, "ID(" + lang + ")")
}

/// ################### RedisResolver ###########################
// This resolver internally uses the GraphResolver to resolve IDs 
// and caches the results in a redis database
function RedisResolver() {
  this.resolver = new GraphResolver()
} 

RedisResolver.prototype.resolve = function(name, callback) {
  var resolver = this.resolver

  redis.hget("names", name, function(err,reply) {
    if (err) 
      return callback(err)
    
    if (reply)
      return callback(null, JSON.parse(reply))

    resolver.resolve(name, function(err, reply) {
      if (err) 
        return callback(err)

      redis.hset("names", name, JSON.stringify(reply))
      return callback(null, reply)
    })
  })
}

RedisResolver.prototype.resolveLocation = function(location, callback) {
  var resolver = this.resolver

  redis.hget("locations", location, function(err,reply) {
    if (err) 
      return callback(err)
    
    if (reply)
      return callback(null, JSON.parse(reply))

    resolver.resolveLocation(location, function(err, reply) {
      if (err) 
        return callback(err)

      redis.hset("locations", location, JSON.stringify(reply))
      return callback(null, reply)
    })
  })

}

/**Used only for 'who speak X'
 * The ID returned must be of type language for Facebook to accept it
 *
 * @param lang the language to search for
 * @param callback the callback which gets the result (since resolve might need a network lookup)
 */
RedisResolver.prototype.resolveLanguage = function(lang, callback) {
  var resolver = this.resolver

  redis.hget("languages", location, function(err,reply) {
    if (err) 
      return callback(err)
    
    if (reply)
      return callback(null, JSON.parse(reply))

    resolver.resolveLanguage(location, function(err, reply) {
      if (err) 
        return callback(err)

      redis.hset("languages", location, JSON.stringify(reply))
      return callback(null, reply)
    })
  })

}