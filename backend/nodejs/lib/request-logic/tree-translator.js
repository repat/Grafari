var C = require("./parser-classes")
var Resolver = require("./resolvers")
var async = require("async")

exports.translate = translate
exports.translateTree = translate


var resolver = new Resolver() //Create a single resolver instance

/** This function takes a flattened tree and a resolver and returns an
 *  array of basic requests to make.
 *  The function takes a callback because resolving ID's might trigger IO
 * 
 * @param flatTree the flattened parse tree
 * @param callback the callback which receives the requests as array of strings (eg. ["/males/12/users-younger/intersect", ...])
 */
function translate(flatTree, callback) {
  //iterator for async.map()
  function iterator(request, itCallback) {
    request.translate(resolver, itCallback)
  }

  async.map(flatTree.requests, iterator, function(err, requestList) {
    if (err)
      return callback(err)

    return callback(null, requestList) //Return resultlist
  })
}


/** Translator methods. Every tree node, which supports this method knows how to convert his
 *  inner state into a Facebook URL-Part.
 *
 * @param resolver the object used to look up IDs of locations and other names (see resolvers.js for an example)
 * @param callback the callback which will be called, once the translation is done
 */


C.BasicRequest.prototype.translate = function(resolver, callback) {
  var conditions = this.conditions
  this.selector.translate(resolver, function(err, selector) {
    async.map(conditions, function(condition, itCallback) {
      condition.translate(resolver, itCallback)
    }, function(err, subRequests) {
      if (err)
        return callback(err)

      if (selector) //prepend selector if existing (if no gender specified, it is empty)
        subRequests.unshift(selector)

      if (subRequests.length > 1) //check whether queries must be intersected
        subRequests.push("/intersect") 

      return callback(null, subRequests.join(""))
    })
  })
}

C.Selector.prototype.translate = function(resolver, callback) {
  if (this.selector == "men") 
    return callback(null, "/males")
  if (this.selector == "women")
    return callback(null, "/females")  

  return callback(null, undefined)
}

C.CondYounger.prototype.translate = function(resolver, callback) {
  return callback(null, "/" + this.age + "/users-younger")
}

C.CondOlder.prototype.translate = function(resolver, callback) {
  return callback(null, "/" + this.age + "/users-older")
}

C.CondAgeBetween.prototype.translate = function(resolver, callback) {
  return callback(null, "/" + this.x + "/" + this.y + "/users-age-2")
}

C.CondAgeEqual.prototype.translate = function(resolver, callback) {
  return callback(null, "/" + this.age + "/users-age")
}

C.CondLiveIn.prototype.translate = function(resolver, callback) {
  var time = this.time
  resolver.resolveLocation(this.location, function(err, locationID) {
    if (err)
      return callback(err)
    return callback(null, "/" + locationID + "/residents/" + time)
  })
}

C.CondFrom.prototype.translate = function(resolver, callback) {
  resolver.resolveLocation(this.location, function(err, locationID) {
    if (err)
      return callback(err)
    return callback(null, "/" + locationID + "/home-residents")
  })
}

C.CondLike.prototype.translate = function(resolver, callback) {
  resolver.resolve(this.what, function(err, itemID) {
    if (err)
      return callback(err)
    return callback(null, "/" + itemID + "/likers")
  })
}

C.CondName.prototype.translate = function(resolver, callback) {
  return callback(null, "/str/" + this.name + "/users-named")
}

C.CondWorkAt.prototype.translate = function(resolver, callback) {
  var time = this.time
  resolver.resolve(this.employer, function(err, id) {
    if (err)
      return callback(err)
    return callback(null, "/" + id + "/employees/" + time)
  })
}

C.CondStudy.prototype.translate = function(resolver, callback) {
  resolver.resolve(this.uni, function(err, id) {
    if (err)
      return callback(err)
    return callback(null, "/" + id + "/students")
  })
}

C.CondBorn.prototype.translate = function(resolver, callback) {
  return callback(null, "/" + this.year + "/date/users-born")
}

C.CondRelationship.prototype.translate = function(resolver, callback) {
  return callback(null, "/" + this.type + "/users")
}

C.CondLang.prototype.translate = function(resolver, callback) {
  resolver.resolveLanguage(this.lang, function(err, id) {
    if (err)
      return callback(err)
    return callback(null, "/" + id + "/speakers")
  })
}
