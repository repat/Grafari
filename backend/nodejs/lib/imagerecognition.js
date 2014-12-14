var request = require("request")
var redis = require("redis")
var rc = redis.createClient()

// Exported functions
exports.imageToTags = imageToTagsCache

function imageToTags(url, callback) {
  var url = "http://api.imagga.com/draft/tags?api_key=acc_0cc34ea494b2b58&url=" + encodeURIComponent(url)

  request({
    url: url,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
      ret = {
        "url": url,
        "tags": tagsToList(body.tags, 10)
      }
      callback(null, ret)

    } else {
      callback(error, null)
    }
  })
}

function imageToTagsCache(url, callback) {
  rc.hget("url", url, function(err,reply) {
    if (!reply) {
      return imageToTags(url, function(e, r) {
        rc.hset("url", url, JSON.stringify(r))
        return callback(e, r)
      })
    } else {
      return callback(null, JSON.parse(reply))
    }
  })
  return
  rc.hget("url", url, function(err,reply) {
    if (err || !reply) {
      console.log(err.message)
      return imageToTags(url, function(e, r) {
        rc.hset("url", url, r)
        return callback(e, r)
      })
    }
    console.log(reply)
    return callback(null, reply)
  })
}

tagsToList = function(tags, confidence) {
    var tags = tags.filter(function(tag) {
      return tag.confidence >= confidence;
    });

    return tags.map(function(elem) { return elem.tag; });
  };
