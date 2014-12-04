var graph = require('fbgraph');

// Exported functions
exports.getIdFromName     = getIdFromName
exports.getIdFromLocation = getIdFromLocation
exports.getIdFromLanguage = getIdFromLanguage
exports.getPictureFromID = getPictureFromID

graph.setAccessToken('736322176438280|N8bcT0U2C4-PHlvoJpqe8ytN1Y8'); //<- AppToken (sollte nicht auslaufen)


/** A generic method to query the facebook graph for a certain ID
 */
function lookupData(name, callback) { 
  var searchOptions = {
      q:    name,
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
  for(var c = 0; c < ary.length; ++c)
    if(predicate(ary[c]))
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
                 entry.name == "State" ||  //eg. Florida
                 entry.name == "Landmark"  //eg. Africa
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

    var language = array_findFirst(res.data, function(element) { return element.category == "Language" })

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
    callback(null,res.location)
  });
}

/** Function to extend the duration of the access token.
 *  At the moment this is not needed
 */
function extendAccessToken(callback) {
  graph.extendAccessToken({
    "client_id":      "736322176438280"
  , "client_secret":  "b15e0263baa65d34312aaf3a0ad8bc44"
  }, callback)
}