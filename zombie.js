var Browser = require('zombie');
var assert  = require('assert');

// We call our test example.com
Browser.localhost('https://www.facebook.com');

// Load the page from localhost
var browser = Browser.create();

browser.visit('/login.php')
  .then( function (error) {

    //assert.ifError(error);

    // login
    browser.fill('email', 'haw-mi@wegwerfemail.de');
    browser.fill('pass', 'geheim123');
    return browser.pressButton('login');
  })
  .done( function(error) {

    //assert.ifError(error);

    // Form submitted, new page loaded.
    //browser.assert.success();

    // Suchfeld befüllen
    console.log(browser.text('._586j'));

    browser.fill('input[name="q"]', '-----------------------------');
    console.log(browser.html('input[name="q"]'));
    

    //console.log(browser.html('._586i'));

    // Suchergebnisse
    //browser.assert.element('#facebar_typeahead_view_list');
    //console.log(browser.htm('#facebar_typeahead_view_list'));

  });