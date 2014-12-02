/**
 * MiSearch main.js
 * PA 27-10-2014
 */
require(['../common'], function () {

    require(['jquery', 'isotope', 'queryToggle', 'underscore', 'searchAPI'], function ($, isotope, queryToggle) {

        // make Isotope a jQuery plugin
        $.bridget('isotope', isotope);

        $(function () {
            console.log('Setting up ...');
            miSearch_init();

            var $container = $('#results');

            $('.result').on('click', '.subQuery', function () {

                var id = $(this).attr("data-id");

                $container.isotope({
                    itemSelector: '.result',
                    layoutMode: 'fitRows',
                    filter: id
                });

            });

            $('.result').on('click', '.mainQuery', function () {
                $container.isotope({
                    itemSelector: '.result',
                    layoutMode: 'fitRows',
                    filter: ''
                });
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

        function updateClickHandler() {

        }

        function make_Users() {
            testdata.get(function (users) {
                var results = $('#results');
                results.isotope('destroy');
                results.empty();
                while (!users.empty()) {
                    var user = users.pop();
                    var userId = user.id.replace(/\./g, "-")
                    results.append('<div id="' + userId + '" class="result'
                    + ' well userWell"></div>');
                    var userDiv = $('#' + userId);

                    userDiv.append('<a class="media-left" href="#">');
                    userDiv.append('<img class="user-img" src="' + user.pictureurl + '" alt="' + user.name + '"></img></a>');
                    console.log(user.pictureurl);
                    var infotext = '<b>' + user.name;

                    if (user.hasOwnProperty("properties")) {
                        while (!user.properties.query.empty()) {
                            userDiv.addClass('' + user.properties.query.pop());
                        }
                        if (user.properties.hasOwnProperty("gender")) {
                            if (user.properties["gender"] === "male") {
                                infotext += ' &#9794';
                            } else if (user.properties["gender"] === "female") {
                                infotext += ' &#9792';
                            }
                        }

                        infotext += '</b><br>';
                        if (user.properties.hasOwnProperty("age")) {
                            infotext += user.properties["age"];
                        }
                        if (user.properties.hasOwnProperty("relationship")) {
                            infotext += ' &#183; ' + user.properties["relationship"];
                        }
                        if (user.properties.hasOwnProperty("employer")) {
                            if (user.properties.hasOwnProperty("profession")) {
                                if (user.properties["profession"] === "unemployed") {
                                    infotext += ' &#183; worked at ' + user.properties["employer"];
                                } else if (user.properties["profession"] === "") {
                                    infotext += ' &#183; works at ' + user.properties["employer"];
                                } else {
                                    infotext += ' &#183; ' + user.properties["profession"] + ' at '
                                    + user.properties["employer"];
                                }
                            } else {
                                infotext += ' &#183; works at '
                                + user.properties["employer"];
                            }
                        }
                        if (user.properties.hasOwnProperty("studies")) {
                            infotext += ' &#183; studies ' + user.properties["studies"];
                            if (user.properties.hasOwnProperty("university")) {
                                infotext += ' at ' + user.properties["university"];
                            }
                        }
                        if (user.properties.hasOwnProperty("lives")) {
                            infotext += ' &#183; lives in ' + user.properties["lives"];
                        }
                        if (user.properties.hasOwnProperty("from") && user.properties["from"] !== user.properties["lives"]) {
                            infotext += ' &#183; used to live in ' + user.properties["from"];
                        }
                    }
                    userDiv.append('<div class="media-body">' + infotext
                    + '</div>');

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
                    layoutMode: 'fitRows'
                });

                queryToggle.toggle();
            });
        }
    });
});

var testdata = {
    get: function (callback) {
        var searchString = $('#queryinput').val()
        var searchEncoded = searchString.replace(/ /g, "%20")
        console.log(searchEncoded)
        $.ajax({
            type: "GET",
            url: "http://localhost:8080/search/" + searchEncoded,
            contentType: "application/json; charset=utf-8",
            //data: contact.toJsonString(),
            dataType: "json",
            success: function (data, status, jqXHR) {
                console.log('-->success', data, status, jqXHR);
                console.log('json string', $.parseJSON(jqXHR.responseText))
                callback.call(this, $.parseJSON(jqXHR.responseText)[0]);

            },
            error: function (jqXHR, status) {
                console.log('-->error', jqXHR, status)
            }
        });


        /*var results = new Object;
         $.getJSON("assets/js/lib/testdata.json", function(data) {
         console.log(data);
         results = data;
         callback.call(this, results);
         });*/
    }
};