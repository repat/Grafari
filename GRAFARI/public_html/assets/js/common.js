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
<<<<<<< HEAD
		parser: '../app/modules/parser'
=======
                underscore: 'underscore-min',
                searchAPI: 'search_api'
>>>>>>> 4ebf384f5c8afd35835990e84549689a81049576
	},
	shim: {
		isotope: {
			deps: ['jquery', 'jqueryBridget']
		}
	}
});