


//TODO when a concrete resolver has been implemented, replace this one
module.exports = DummyResolver


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