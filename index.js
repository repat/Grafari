// Dependencies
var Browser = require('zombie');
var graph = require('./lib/graph.js');
var fs = require('fs');

// static variables
var targetCity = 'Hamburg, Germany';
var targetPerson = 'john%2Bdoe';
//var ageFrom = 20;
//var ageTo = 30;

// bootstrap
Browser.localhost('https://www.facebook.com');
var browser = Browser.create();

// program execution
browser.visit('/login.php')
.then(function() {
    loginFacebook();
})
.done(function() {
    searchFriendsByCity(targetCity);
    //searchPersonByName(targetPerson);
});



var loginFacebook = function() {
    browser.fill('email', 'haw-mi@wegwerfemail.de');
    browser.fill('pass', 'geheim123');
    return browser.pressButton('login');
};


// gibt manchmal eine Seite mit Titel 'Suche im Social Graph | Facebook' aus.
var searchFriendsByCity = function(city) {
    graph.getIdFromLocation(city, function(cityId) {

        console.log('searching for friends from ' + city + ' (id: ' + cityId + ')');
        browser.visit('/search/' + cityId + '/residents/present')
        .done(function() {
            console.log(browser.text('title'));

            console.log('html: ' + browser.html('#browse_result_area'));
          //   fs.writeFile('test.html', browser.html(), function(err) {
          //       if (err) 
          //           return console.log(err);
          //       console.log('Ergebnis in Datei gespeichert');
          //   });
        });

    });
};

// page Titel ist 'Suche im Social Graph | Facebook' sollte aber 'People named "John Doe"' sein.
var searchPersonByName = function(person) {

    console.log('searching for people with the name: ' + person);
    browser.visit('https://www.facebook.com/search/str/' + person + '/users-named')
    .then(function() {
        console.log(browser.text('title'));
    })
};

