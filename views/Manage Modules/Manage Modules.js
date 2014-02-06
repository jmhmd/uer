


$(document).ready(function(){
  $("#addModule").click(function(){
    $("#addModuledropdown").slideToggle("slow");
  });
});

$(document).ready(function(){
  $("#manageUsers").click(function(){
    $("#manageUsersdropdown").slideToggle("slow");
  });
});

$(document).ready(function(){
  $("#viewModules").click(function(){
    $("#currentModules").slideToggle("slow");
  });
});


$(document).ready(function(){
	$("#nameModulesubmit").click(function(){
		$ /*serverlocation*/.post(input["moduleNameinput"]).val()  //Code to add the name of the new module to the server.
	});
});

$(document).ready(function(){
  $("nameModulesubmit").click(function(){
    $.get("C:/Users/Damian/Desktop/Web%20Files/Add%20New%20Module/Add%20New%20Module.html");
  });
});




//Add code that opens Question Editor within the just named new module, with the name of the new module at the top.


