var graph = require('fbgraph');

var getIdFromLocation = function(location, callback) {

    // das ist der Usertoken von hier und läuft nach einer Stunde ab: https://developers.facebook.com/tools/accesstoken/
    graph.setAccessToken('CAACEdEose0cBADcdv7qHUNC832Jn0a0oUnAfd6raljnPeZCZCbWL1SLcJnTO5w25DCE5Uv8GsejjauZC2k9SBP4Noh1wdKuvMXBAKcxGCOtdsR1FZCoyZCj21H8j2D36fDMwxCJZA2tCjFooSd1VNxxwJcYIrKeAxVS8MUWoA5QLlfLy08EzjvN1k3xh2rPlBMTkd9eYTAowZDZD');

    // extending static access token
    graph.extendAccessToken({
        "client_id":      "736322176438280"
      , "client_secret":  "b15e0263baa65d34312aaf3a0ad8bc44"
    }, function (err, facebookRes) {
       //console.log(facebookRes);
    });

    var searchOptions = {
        q:    location,
        type: 'page'
    };

    graph.search(searchOptions, function(err, res) {
      if (err) 
        return callback(err)


      // FB gibt manchmal nichts zurück. Einfach nochmal probieren.
      callback(null, res.data[0].id);
    });

};

exports.getIdFromLocation = getIdFromLocation;