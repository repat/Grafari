Grafari
=========
**Grafari** is a Facebook Graph Search scraping tool. It's been developed as part of a lecture on *Modelling of Information Systems* at the University of Applied Sciences Hamburg by 11 Master students. You can find more information in the wiki, it's probably in German though.

Facebook changes the layout regularly so this might not work anymore. Most probably they added, removed or renamed a `<div>` tag.

The point of this (besides passing the lab) is to show, that if a bunch of students can do this in 3 months, every marketing and advertising company as well as [intelligence services](https://en.wikipedia.org/wiki/Open-source_intelligence) (even with no [direct access to Facebook servers](http://www.theguardian.com/world/2013/jun/06/us-tech-giants-nsa-data)) can do this as well.

# DISCLAIMER
> Scraping Facebook is forbidden according to the [Automated Data Collection Terms](https://www.facebook.com/apps/site_scraping_tos_terms.php) (April 15th, 2010). This is in no way an encouragement or a request to scrape Facebook but merely an academical proof-of-concept. We also don't offer a service. Use this software at your own risk. We are not responsible for what you are doing with this software.

## Technology 
To better divide the tasks we split into a frontend, backend and image recognition team. Queries can include `AND` and `OR`. For time and abuse prevention reasons, it is only possible to query for 12 people. It is however possible to reverse-engineer a bit more as shown by the [facebook-uid-scraper Chrome Plugin](https://chrome.google.com/webstore/detail/fb-uid-scraper/mhfeilckipmpkmoblecjildbpgdjjpnj) by [autoclick.us](http://www.autoclick.us/2014/08/facebook-uid-target-scan-uid-from-graph.html).

#### Frontend
The Frontend Team consists of a webpage which allows the user to enter a query in a (more or less) natural language. It can send the request to the backend and parse the repsonse, display, sort and filter it and it includes a search history. It's also possible to query each profile photo for image recognition tags.
* HTML5
* CSS 3
* JavaScript
* [Fancybox](http://fancybox.net/)

#### Backend
The backend parses the request, queries Facebook, parses the returned Graph Search Page, caches the result in a Redis Database and offeres the data via Rest API.
* node.js
* Redis
* npm
* [zombie.js](https://github.com/assaf/zombie) as a headless browser
* [restify](https://github.com/assaf/zombie) for building Rest API
* node modules: async, fbgraph, nodemon, redis, request

#### Image recogniction
* [Imagga](http://imagga.com)
* included in both the backend (accessible via Rest API) and frontend

## Screenshots
