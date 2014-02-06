



$(document).ready(function(){
	$("#submitButton").click(function(){
		confirm("Submit this question?");
	});
});



// on.(event(function()) may be useful in the future //  

$(document).ready(function(){
  $("#editQuestionbutton").click(function(){
    $('textarea').removeAttr('readonly');
    $('input').removeAttr('readonly');
    $('textarea').css("color", "black");
    $('textarea').css("background-color", "white");
    $('input').css("color", "black");
    $('input').css("background-color", "white");
    $("#editQuestionbutton").replaceWith('<div id="submitChangesbutton">Submit Changes</div>');
  });});


/*  This code does not work, unsure why.  Tried positioning above and below the function that creates the new <div>.
  just like the one at the top of the page for #submitButton, but it does not.

  $(document).ready(function(){
    $("#submitChangesbutton").click(function(){
     confirm("Submit these changes?");
    });
  });

*/

$(document).ready(function(){
  $("#questionTab1").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

$(document).ready(function(){
  $("#questionTab2").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

$(document).ready(function(){
  $("#questionTab3").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

$(document).ready(function(){
  $("#questionTab4").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

$(document).ready(function(){
  $("#questionTab5").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

$(document).ready(function(){
  $("#questionTab6").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

$(document).ready(function(){
  $("#questionTab7").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

$(document).ready(function(){
  $("#questionTab8").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

$(document).ready(function(){
  $("#questionTab9").click(function(){
    $("#currentNumber").html($(this).html());
  });
});

/*
var html = "<li><span>This is an initial list item</span>",
    div = $("#funtimes");

for (i = 0, l = 10; i < l; i++) {
  html += "<li><span>This is list item" + (i + 1) + "</span>";
}

div.append(html);


$(document).ready(function(){
    $("#previewButton").click(function() {
        var clinicalInfo = $("input[name=clinicalInfo]").val();
        $("#questionpreviewcontainer").append('<div class="clinicalInfopreview">' + clinicalInfo + '</div>');



$(document).ready(function(){
  $("#viewModules").click(function(){
    $("#currentModules").slideToggle("slow");
  });
});

*/

dd


