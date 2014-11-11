/**
 * MiSearch main.js
 * PA 27-10-2014
 */

$(function(){
	console.log('Setting up ...');
	miSearch_init();

	var $container = $('#results');

	$('.subQuery').click(function(){
		var id = $(this).attr("data-id");

		$container.isotope({
		  itemSelector: '.result',
	  	  layoutMode: 'fitRows',
		  filter: id
		});
	});

	$('.mainQuery').click(function(){
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
function miSearch_init(){
	// Setup Button Handler
	miSearch_reg_btn();


	// Example text for the demo
    $(".form-control").val("All people who live in Germany AND ( people who are self-employed OR NOT people who are homeless )");
}

/**
 * Register Page-Handler
 */
function miSearch_reg_btn(){
	var brandRow = $('#brandRow');
	var resultWell = $('#resultWell');
	var queryHistory = $('#queryHistory');
	var resultSpinner = $('#resultSpinner');
	var results = $('#results');
	
	$('#btn_search').click(function(){
		brandRow.removeClass('center');
		
		setTimeout(function(){
			resultWell.removeClass('hidden');
			queryHistory.removeClass('hidden');
		}, 400);
		
		setTimeout(function(){
			resultSpinner.addClass('hidden');
			results.removeClass('hidden');
			init_isotope();
		}, 1000);
	});
	
	$('#btn_clear').click(function(){
		resultWell.addClass('hidden');
		brandRow.addClass('center');
		resultSpinner.removeClass('hidden');
		results.addClass('hidden');
	});
	
}

function init_isotope(){
	var $container = $('#results');
	// init
	$container.isotope({
	  // options
	  itemSelector: '.result',
	  layoutMode: 'fitRows'
	});
}