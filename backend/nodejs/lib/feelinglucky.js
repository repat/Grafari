// this module is originally written by the ten working group(http://wg.oftn.org/)
// unter the MIT License
var HTTP = require("http");

exports.getFeelingLuckyResult = function(query, callback) {
    var search_url = "/ajax/services/search/web?v=1.0&q=" + encodeURIComponent(query);
    var request = HTTP.request({
        'method' : 'GET',
        'port' : 80,
        'path' : search_url,
        'hostname': 'ajax.googleapis.com',
        'Referer': 'http://www.v8bot.com',
        'User-Agent': 'NodeJS HTTP client',
        'Accept': '*/*'});
    request.addListener('response', function(response) {
        response.setEncoding('utf8');
        var body = "";
        response.addListener('data', function(chunk) { body += chunk; });
        response.addListener('end', function() {
            var searchResults = JSON.parse(body);
            var results = searchResults.responseData.results;

            if (results && results[0]) {
                results[0].url = decodeURIComponent(results[0].url);
                return callback(null,results[0].url);
            } else {
                return callback("I'm not feeling lucky today :(");
            }
        });
    });
    request.end();
};