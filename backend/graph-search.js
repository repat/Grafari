// Dependencies
var async = require('async');
var Browser = require('zombie');
var fs = require('fs');
var restify = require('restify');
var graph = require('./lib/graph.js');


// bootstrap
Browser.localhost('https://www.facebook.com');
var browser = Browser.create();

var server = restify.createServer({
    name: 'Grafari'
});
server.get('/searchPeopleByCity/:city', searchPeopleByCity);
server.head('/searchPeopleByCity/:city', searchPeopleByCity);
server.get('/searchPersonByName/:name', searchPersonByName);
server.head('/searchPersonByName/:name', searchPersonByName);


// program execution
async.series({
    facebookLogin: function (callback) {

        console.log('---\nloginFacebook');

        browser.visit('/login.php')
                .done(function () {

                    browser.fill('email', 'haw-mi@wegwerfemail.de');
                    browser.fill('pass', 'geheim123');
                    browser.pressButton('login');
                    console.log('Facebook loged in!');
                    callback(null);
                });
    },
    startWebserver: function (callback) {
        server.listen(8080, function () {
            console.log('%s listening at %s', server.name, server.url);
            callback(null);
        });
    }
});

function searchPeopleByCity(req, res, next) {

    console.log("---\nsearchPeopleByCity");

    graph.getIdFromLocation(req.params.city, function (err, cityId) {
        if (err) {
            console.log('getIdFromLocation returned with following error: \n' + JSON.stringify(err))
            throw 'Facebook-Search failed!'
        }

        console.log('query: ' + req.params.city + ' (id: ' + cityId + ')');

        browser.visit('/search/' + cityId + '/residents/present')
                .done(function () {
                    console.log('result' + browser.text('title'));
                    res.send('result ' + browser.text('title'));

                    // fs.writeFile('test.html', browser.html('#browse_result_area'), function(err) {
                    //     if (err)
                    //         return console.log(err);
                    //     console.log('Ergebnis in Datei gespeichert');
                    next();
                    //});
                });
    });
}

function searchPersonByName(req, res, next) {

    console.log('---\nsearchPersonByName');
    console.log('query: ' + req.params.name);

    browser.visit('https://www.facebook.com/search/str/' + req.params.name + '/users-named')
            .done(function () {
                console.log('result: ' + browser.text('title'));
                res.send('result: ' + browser.text('title'));
                next();
            });
}