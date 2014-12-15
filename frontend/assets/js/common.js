//The build will inline common dependencies into this file.
//For any third party dependencies, like jQuery, place them in the lib folder.
//Configure loading modules from the lib directory,
//except for 'app' ones, which are in a sibling
//directory.
requirejs.config({
    baseUrl: 'assets/js/lib',
    paths: {
        app: '../app',
        bootstrap: 'bootstrap',
        isotope: 'isotope',
        jquery: 'jquery',
        jqueryBridget: 'jquery.bridget',
        moduleSkeleton: '../app/modules/moduleSkeleton',
        queryToggle: '../app/modules/queryToggle',
        underscore: 'underscore-min',
        searchAPI: 'search_api'
    },
    shim: {
        isotope: {
            deps: ['jquery', 'jqueryBridget']
        }
    }
});