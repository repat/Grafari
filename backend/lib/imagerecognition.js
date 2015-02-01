var request = require("request")
var redis = require("redis")
var rc = redis.createClient()
const IMAGGA_API_KEY = "EnterYourAPIKeyHere"

// Exported functions
exports.imageToTags = imageToTagsCache

function imageToTags(url, callback) {
    if (!url)
        return callback("url not defined", null)
    var url = "http://api.imagga.com/draft/tags?api_key="+ IMAGGA_API_KEY + "&url=" + encodeURIComponent(url)

    request({
        url: url,
        json: true
    }, function(error, response, body) {

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
    rc.hget("url", url, function(err, reply) {
        if (!reply) {
            return imageToTags(url, function(e, r) {
                rc.hset("url", url, JSON.stringify(r))
                return callback(e, r)
            })
        } else {
            return callback(null, JSON.parse(reply))
        }
    })
}

tagsToList = function(tags, confidence) {
    var tags = tags.filter(function(tag) {
        return tag.confidence >= confidence;
    });

    return tags.map(function(elem) {
        return elem.tag;
    });
};
