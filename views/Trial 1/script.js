$(document).ready(function() {
    $('div').mouseenter(function() {
        $('div').fadeTo('fast',1);
    });
    $('div').mouseleave(function() {
        $('div').fadeTo('fast', 0.7);
    });
});

$(document).ready(function() {
	$("#modemenu").click(function() {
    	$("#modemenu").accordion({collapsible: true, active: false});
    });
});