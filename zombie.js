var Browser = require('zombie');
var graph = require('fbgraph');

var city = 'Hamburg, Germany';


Browser.localhost('https://www.facebook.com');

var browser = Browser.create();

browser.visit('/login.php')
  .then( function (error) {

    // FB login
    browser.fill('email', 'haw-mi@wegwerfemail.de');
    browser.fill('pass', 'geheim123');
    return browser.pressButton('login');
  })
  .done( function(error) {

    // Form submitted, new page loaded.
    //browser.assert.success();

    // Suchfeld befüllen
    //console.log(browser.text('._586j'));

    //browser.fill('input[name="q"]', '-----------------------------');
    //console.log(browser.html('input[name="q"]'));
    
    //
    // gets the city id from graph api
    //

    // das ist der Usertoken von hier: https://developers.facebook.com/tools/accesstoken/
    graph.setAccessToken('CAACEdEose0cBAEht0aOcGuUWHDxo8hPOd1GslRwB0H0mAZAZA2DCGOiaweRvPVLRXGKsvh4ZAdHipwZBuEDeiBlp0qsmpwEZBqvQtrjFxL0ANKHi6YRQ0VBe6Xnnxnd5hancpI3xvuHo86uIMN6EDv7RvxaR9ouzBCOAD7fgKN60bZCJTN8wTnVlk2gcplsLNUiz6ezEXKeAZDZD');

    // extending static access token
    graph.extendAccessToken({
        "client_id":      "736322176438280"
      , "client_secret":  "b15e0263baa65d34312aaf3a0ad8bc44"
    }, function (err, facebookRes) {
       //console.log(facebookRes);
    });

    var searchOptions = {
        q:    city,
        type: 'page'
    };

    graph.search(searchOptions, function(err, res) {
        var cityId = res.data[0].id;
        console.log('ID von ' + city + ': ' + cityId);


        //
        // Der Teil will noch nicht so richtig. Habe Probleme mit dem non Blocking von Node
        //
        browser.visit('/search/' + cityId + '/residents/present')
        .then(function(error) {
            console.log(browser.html('#u_0_o'));
        })
        .done(function(error) {
            console.log('done!');
        })

    });

  });

