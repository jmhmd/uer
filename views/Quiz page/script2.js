


$(document).ready(function() {
$(function () {
    $("#sidebar").toggle(function () {
        $("#sidebar").animate({left:'0px'}, {queue: false, duration: 500});
    }, function () {
        $("#sidebar").animate({left:'-100px'}, {queue: false, duration: 500});
    });
});
});
});



$(document).ready(function(){
  $("#flip").click(function(){
    $("#panel").slideToggle("slow");
  });
});


$(document).ready(function() {
    $('image').draggable();
});

$(document).ready(function() {
    $('image').resizable();
});
