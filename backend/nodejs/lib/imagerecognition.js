var request = require("request")

// Exported functions
exports.imageToTags = imageToTags

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

tagsToList = function(tags, confidence) {
  var tags = tags.filter(function(tag) {
    return tag.confidence >= confidence;
  });

  return tags.map(function(elem) { return elem.tag; });
};
