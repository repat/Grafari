/**
 * MiSearch main.js
 * PA 27-10-2014
 */
require(['../common'], function () {

    require(['jquery', 'isotope', 'queryToggle', 'fancybox', 'underscore', 'searchAPI'], function ($, isotope, queryToggle, fancybox) {

        // make Isotope a jQuery plugin
        $.bridget('isotope', isotope);

        $(function () {
            console.log('Setting up ...');
            miSearch_init();

            var $container = $('#results');

            $('.result').on('click', '.subQuery, .mainQuery', function () {
                $('#queryinput').val($(this).text());
            });

            $('.fancybox').fancybox({
                padding : 0,
                openEffect  : 'elastic'
            });
        });

        /**
         * Initial Page Setup
         */
        function miSearch_init() {
            // Setup Button Handler
            miSearch_reg_btn();

            // Example text for the demo
            // $(".form-control").val("All people who live in Germany AND ( people who are self-employed OR NOT people who are homeless )");
            $(".form-control").val("All people who live in Hamburg");
        }

        /**
         * Register Page-Handler
         */
        function miSearch_reg_btn() {
            var brandRow = $('#brandRow');
            var resultWell = $('#resultWell');
            var queryHistory = $('#queryHistory');
            var resultSpinner = $('#resultSpinner');
            var results = $('#results');
            var formInput = $('#queryinput');
            var currentQuery = $('#current-query');

            $('#btn_search').click(function () {
                make_Users();

                var tokens = search._tokenize(formInput.val());
                currentQuery.empty();
                currentQuery.append(make_Current_Query(formInput.val()));
                //console.log('Tokenized: ' + JSON.stringify(tokens));
                //console.log('Tokenized: ' + JSON.stringify(parser.parse(tokens)));

                brandRow.removeClass('center');
                resultSpinner.removeClass('hidden');
            });

            $("#queryinput").keyup(function (event) {
                if (event.keyCode == 13) {
                    $("#btn_search").click();
                }
            });

            $('#btn_clear').click(function () {
                resultWell.addClass('hidden');
                brandRow.addClass('center');
                resultSpinner.removeClass('hidden');
                results.addClass('hidden');
            });

        }

        function init_isotope() {
            var $container = $('#results');
            // init
            $container.isotope({
                // options
                itemSelector: '.result',
                layoutMode: 'fitRows'
            });
        }

        function make_Current_Query(query) {
            var queryDivs = '<div class="mainQuery queryText">' + query + '</div><ul class="history">';
            var tokens = search._tokenize(query).reverse();
            var querycounter = 1;
            while (!tokens.empty()) {
                var cur = tokens.pop();
                if (typeof cur === "string") {
                    queryDivs += '<li class="subQuery queryText" data-id=".' + querycounter++ + '">' + cur + '</li>';
                } else {
                    if (cur.name === "(") {
                        queryDivs += '<li><ul class="history">';
                    } else if (cur.name === ")") {
                        queryDivs += '</ul></li>';
                    } else {
                        queryDivs += '<li class="token nav">' + cur.name + '</li>';
                    }
                }
            }
            queryDivs += '</ul>';
            return queryDivs;
        }

        var addUniLink = function (university, universityCount) {
            $.ajax({
                type: "GET",
                url: "https://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=" + university.replace(/ /g, "+"),
                dataType: "jsonp",
                success: function (data) {
                    var spanId = "#uni" + universityCount;
                    var unescapedUrl = data.responseData.results[0].unescapedUrl.toString();
                    if (unescapedUrl) {
                        if (unescapedUrl.indexOf("facebook.com") >= 0) {
                            $(spanId).html('<a class="fancybox" href="' + unescapedUrl + '">' + university + '</a>');
                        } else {
                            $(spanId).html('<a class="fancybox" data-fancybox-type="iframe" href="' + unescapedUrl + '">' + university + '</a>');
                        }
                    } else {
                        $(spanId).html(university);
                    }
                },
                error: function (jqXHR, status) {
                    console.log('-->2error', jqXHR, status)
                }
            });
        }

        var createInfoElement = function (spanText) {
            return '</br>&#183;' + spanText;
        }

        function make_Users() {
            userData.get(function (response) {
                var users = response.users;
                var results = $('#results');
                results.isotope('destroy');
                results.empty();

                var universitySpanCount = 1;
                while (!users.empty()) {
                    var user = users.pop();
                    var userUrl = 'https://www.facebook.com/' + user.id;
                    var userId = user.id.replace(/\./g, "-");
                    results.append('<div id="' + userId + '" class="result'
                    + ' well userWell"></div>');
                    var userDiv = $('#' + userId);

                    //userDiv.append('<a class="media-left" href="#">');
                    userDiv.append('<a href="' + userUrl + '" target="_blank"><img class="user-img" src="' + user.pictureurl + '" alt="' + user.name + '"></img></a>');
                    var infotext = '<div class="userInfo"><b>' + '<a href="' + userUrl + '" target="_blank">' + user.name + '</a>';

                    /*while (!user.query.empty()) {
                     userDiv.addClass('' + user.query.pop());
                     }*/
                    if (user.hasOwnProperty("gender")) {
                        if (user.gender === "male") {
                            infotext += ' &#9794';
                        } else if (user.gender === "female") {
                            infotext += ' &#9792';
                        }
                    }


                    if (user.hasOwnProperty("age")) {
                        infotext += user.age;
                    }
                    if (user.hasOwnProperty("relationship")) {
                        infotext += '</br>' + user.relationship;
                    }
                    if (user.hasOwnProperty("employer")) {
                        if (user.hasOwnProperty("profession")) {
                            if (user.profession === "unemployed") {
                                infotext += createInfoElement('worked at ' + user.employer);
                            } else if (user.profession === "") {
                                infotext += createInfoElement('works at ' + user.employer);
                            } else {
                                infotext += createInfoElement(user.profession + ' at ' + user.employer);
                            }
                        } else {
                            infotext += createInfoElement('works at ' + user.employer);
                        }
                    }
                    if (user.hasOwnProperty("studies")) {
                        var studieText = 'studies ' + user.studies;
                        if (user.hasOwnProperty("university")) {
                            studieText += ' at ' + '<span id="uni' + universitySpanCount + '"></span>';
                            addUniLink(user.university, universitySpanCount);
                            universitySpanCount++;
                        }
                        infotext += createInfoElement(studieText);
                    }
                    if (user.hasOwnProperty("lives")) {
                        infotext += createInfoElement('lives in ' + user.lives);
                    }
                    if (user.hasOwnProperty("from") && user.from !== user.lives) {
                        infotext += createInfoElement('used to live in ' + user.from);
                    }
                    infotext += '</b>';

                    // add tags-section to user div
                    infotext += '<div class="user-div-tags"><div data-id="' + user.id + '" class="tags-icon tags-icon-default"></div><div class="tags-text"></div></div>';
                    infotext += '</div><br>';

                    userDiv.append(infotext);
                }


                var brandRow = $('#brandRow');
                var resultWell = $('#resultWell');
                var queryHistory = $('#queryHistory');
                var resultSpinner = $('#resultSpinner');
                var results = $('#results');


                resultWell.removeClass('hidden');
                queryHistory.removeClass('hidden');

                resultSpinner.addClass('hidden');
                results.removeClass('hidden');

                var $container = $('#results');
                // init
                $container.isotope({
                    // options
                    itemSelector: '.result',
                    layoutMode: 'vertical'
                });

                queryToggle.toggle();
            });
        }
    });
});

var userData = {
    get: function (callback) {
        var searchString = $('#queryinput').val()
        var searchEncoded = searchString.replace(/ /g, "%20")
        $.ajax({
            type: "GET",
            url: "http://localhost:8080/search/" + searchEncoded,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data, status, jqXHR) {
                $('#resultSpinner').addClass('hidden');
                console.log('-->success', data, status, jqXHR);
                console.log('json string', $.parseJSON(jqXHR.responseText));
                callback.call(this, $.parseJSON(jqXHR.responseText));

            },
            error: function (jqXHR, status) {
                console.log("\n\n\n Token erneuert? \n\n\n");
                console.log('-->error', jqXHR, status)
            }
        });
    }
};