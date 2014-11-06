/**
 * MiSearch main.js
 * PA 27-10-2014
 */

$(function(){
	console.log('Setting up ...');
	miSearch_init();
});

/**
 * Initial Page Setup 
 */
function miSearch_init(){
	// Setup Button Handler
	miSearch_reg_btn();
}

/**
 * Register Page-Handler
 */
function miSearch_reg_btn(){
	var searchForm = $('#searchForm');
	var resultWell = $('#resultWell');
	
	$('#btn_search').click(function(){
		searchForm.removeClass('center');
		
		setTimeout(function(){
			resultWell.removeClass('hidden');
		}, 400);
	});
	
	$('#btn_clear').click(function(){
		resultWell.addClass('hidden');
		searchForm.addClass('center');
	});
	
}