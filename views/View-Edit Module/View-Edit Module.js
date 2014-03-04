



var module = ["1", "2", "3"];


$(document).ready(function(){
  for (var i = 1; i <= module.length; i++) {
    $("#questionRow").append('<tr><td id="questionTab">' + (i) + '</td></tr>');
    var questionRowLength = $('#questionRow tr').length;
    $("#totalNumber").html(questionRowLength);}
});




/*
var alertData = []
$.each(module[0], function(index, value) {
    alertData.push(index + ': ' + value);
});
alert(JSON.stringify(alertData));


var myData = $(module[0])   //.serialize();//
alert(myData);
*/




/*
Trying to populate form with pre-existing module data as retrieved from the server.
Saw these two examples online.

function populate(frm, data) {   
    $.each(data, function(key, value){  
    var $ctrl = $('[name='+key+']', frm);  
    switch($ctrl.attr("type"))  
    {  
        case "text" :   
        case "hidden":  
        $ctrl.val(value);   
        break;   
        case "radio" : case "checkbox":   
        $ctrl.each(function(){
           if($(this).attr('value') == value) {  $(this).attr("checked",value); } });   
        break;  
        default:
        $ctrl.val(value); 
    }  
    });  
}


$.each(data, function(name, val){
    var $el = $('[name="'+name+'"]'),
        type = $el.attr('type');

    switch(type){
        case 'checkbox':
            $el.attr('checked', 'checked');
            break;
        case 'radio':
            $el.filter('[value="'+val+'"]').attr('checked', 'checked');
            break;
        default:
            $el.val(val);
    }
});

*/



function Question(caseImage, clinicalInfo, question, choiceA, explanationA, choiceB, explanationB, choiceC, explanationC, choiceD, explanationD, choiceE, explanationE) {
    this.caseImage = caseImage;
    this.clinicalInfo = clinicalInfo;
    this.question = question;
    this.choiceA = choiceA;
    this.explanationA = explanationA;
    this.choiceB = choiceB;
    this.explanationB = explanationB;
    this.choiceC = choiceC;
    this.explanationC = explanationC;
    this.choiceD = choiceD;
    this.explanationD = explanationD;
    this.choiceE = choiceE;
    this.explanationE = explanationE;
};


var addReadOnly = function(){
    $('textarea, input').prop('readonly', true);
    $('textarea, input').css("color", "#686868");
    $('textarea, input').css("background-color", "#C8C8C8");
    $('#textfields, #moretextfields').css("color", "#686868");
  };


var removeReadOnly = function(){
    $('textarea, input').removeAttr('readonly');
    $('textarea, input').css("color", "black");
    $('textarea, input').css("background-color", "white");
    $('#textfields, #moretextfields').css("color", "black");
  };


$(document).ready(function(){
  $("#editQuestionbutton").click(function(){
    removeReadOnly();
  });
});


/*
 $(document).ready(function() {
     $(document).on('change', 'input:file', function(event) {
       $.post("addNewImage.asp",((parseInt($('#currentNumber').html(), 10) - 1), "#moduleName".html()), function(status, result){
          if (status == "success"){
            $("#imagePreview").attr('src', result);
            $('#caseImage').attr('readonly');
          };
     });
  });
*/


$(document).ready(function(){
  $("#submitButton").click(function(){
    confirm("Submit Question?");
    
    
    var insertSpot = parseInt($('#currentNumber').html(), 10) - 1;
    module[insertSpot] = new Question ($('#caseImage').val(), $('#clinicalInfo').val(), $('#question').val(), $('#choiceA').val(), $('#explanationA').val(), $('#choiceB').val(), $('#explanationB').val(), $('#choiceC').val(), $('#explanationC').val(), $('#choiceD').val(), $('#explanationD').val(), $('#choiceE').val(), $('#explanationE').val());
    
    if (module.length > 0){
      $("#confirmationDiv").fadeIn(300).delay(200).fadeOut(300);}
      else{
      $("#failureDiv").fadeIn(300).delay(300).fadeOut(300);}

    var next = $("#questionRow td.clicked").parent().next().children('td');
    $("#questionRow td").removeClass('clicked');
    next.addClass('clicked');

    $("#currentNumber").html($('#questionRow td.clicked').html());

    addReadOnly();

/*    var alertData = []
    $.each(module[insertSpot], function(index, value) {
    alertData.push(index + ': ' + value);
    });
    alert(JSON.stringify(alertData));*/
    
  });
});




/*
Probably won't need this as the above seems to generally work, but it depends on whether or not I can get the module[] area to equal 
a dynamic value based on which question number is clicked so that it adds to that spot in the module array.

$(document).ready(function(){
	$("#submitButton").click(function(){
    confirm("Submit Question?");
    if (response = true){
    $('textarea').attr('readonly');
    $('input').attr('readonly');
    $('textarea').css("color", "#686868");
    $('textarea').css("background-color", "#C8C8C8");
    $('input').css("color", "#686868");
    $('input').css("background-color", "#C8C8C8");
    questionBeingAdded = new Question ($('#caseImage').val(), $('#clinicalInfo').val(), $('#question').val(), $('#choiceA').val(), $('#explanationA').val(), $('#choiceB').val(), $('#explanationB').val(), $('#choiceC').val(), $('#explanationC').val(), $('#choiceD').val(), $('#explanationD').val(), $('#choiceE').val(), $('#explanationE').val());
    module.push(questionBeingAdded);
    confirm(module.length);
    };
	});
});
*/


// on.(event(function()) may be useful in the future //  


$(document).ready(function(){
  $("#addQuestionbutton").click(function(){
    var questionRowLength = $('#questionRow tr').length;
    $("#questionRow td").removeClass('clicked');
    $("#questionRow").append('<tr><td id="questionTab" class="clicked">' + (questionRowLength + 1) + '</td></tr>');
    var questionRowLength = questionRowLength + 1;
    $("#totalNumber, #currentNumber").html(questionRowLength);
    removeReadOnly();
      
  });
});


/*
Something like if class == 'clicked' then get html data from that row and parse it to interval to place in module [_], to retrieve
  data to fill in the form.
*/


/*
Probably need to use .each() method below

$(document).ready(function(){
  $('#editQuestionbutton').click(function(){
  for (var i = 0; i < $('#questionRow tr').length; i++) {
    if ($('questionRow td').hasClass('clicked')) {
      var integer = $('#questionRow td.clicked').html();
      var retrieveSpot = parseInt(integer, 10) - 1;
      alert(retrieveSpot);
    };
    };
  });
  });
*/  


//  $.each(module[0], function(i,val) { $('#'+ i).val(val); //
 


$(document).ready(function(){
  $(document).on('click', '#questionRow td', function(event) {
        $('#questionRow td').not(this).removeClass('clicked');
        $(this).toggleClass('clicked'); 
        $("#currentNumber").html($('#questionRow td.clicked').html());

        var currentSpot = parseInt($('#currentNumber').html(), 10);
        if (module.length>=currentSpot){
          addReadOnly();

          function populate(frm, data) {
            $.each(data, function(key, value){
            $('[name='+key+']', frm).val(value);
             }
            };

          populate('#form1', $.parseJSON(module[currentSpot - 1]));
         
        } 
        else {removeReadOnly();}

        /*
        This is where to look in the module array if a corresponding object already exists there.
        */
        

        var currentSpot = parseInt($('#currentNumber').html(), 10);
        if (module.length>=currentSpot){
          function populate(frm, data) {
            $.each(data, function(key, value){
            $('[name='+key+']', frm).val(value);
             });
            }

          populate('#form1', $.parseJSON(module[currentSpot - 1]));
         }


        /*function populate(frm, data) {
          $.each(module[0], function(key, value){
          $('[name='+key+']', frm).val(value);
           });
          }

          populate('#form1', $.parseJSON(module[0]));
        */


        /*    var alertData = []
        $.each(module[insertSpot], function(index, value) {
        alertData.push(index + ': ' + value);
        });
        alert(JSON.stringify(alertData));
        */


        /*var moduleSearchSpot = parseInt($('#currentNumber').html(), 10) - 1;
        if(module[moduleSearchSpot].length > 0) {
          addReadOnly;} else {
            removeReadOnly;
        */
    });
});


/*    $(document).on('change', '#questionRow td', (function() {
        $('#questionRow td').not(this).removeClass('clicked');
        $(this).toggleClass('clicked'); 
        $("#currentNumber").html($('#questionRow td.clicked').html());*/




/*$.each(data, function(name, val){
    var $el = $('[name="'+name+'"]'),
        type = $el.attr('type');

    switch(type){
        case 'checkbox':
            $el.attr('checked', 'checked');
            break;
        case 'radio':
            $el.filter('[value="'+val+'"]').attr('checked', 'checked');
            break;
        default:
            $el.val(val);
    }
});
*/




        //Will eventually move to global variable to access in all functions, but this works for testing for now//
        //var retrieveSpot = parseInt($('#currentNumber').html(), 10) - 1;//
        //get data from module[td which has class clicked (probably through html content using parseInt)] and fill in the form//


$(document).ready(function(){
  var questionRowLength = $('#questionRow tr').length;
  $("#totalNumber").html(questionRowLength);
});



var imageHeight = $('#imagepreviewDiv img').height();
    if (imageHeight < 540) {
        var margintop = (540 - imageHeight) / 2;
        $('#imagepreviewDiv img').css('margin-top', margintop);
    };

/*
Would like this to work so that the functionality of changing current number in questionNav is not lost when the user adds a new question.
The add new Question button, however only currently creates a new <td> with id="questionTab" which is generic and not specific which is why
I think we can't use the this function properly.

$(document).ready(function(){
  $("#questionTab").click(function(){
    $("#currentNumber").html($(this).html());
  });
});
*/


/*
$(document).ready(function(){
  $("#questionRow td.clicked").click(function(){
    $("#currentNumber").html($(this).html());
  });
});
*/


/*
$(document).ready(function(){
  $("#questionTab1, #questionTab2, #questionTab3, #questionTab4, #questionTab5, #questionTab6, #questionTab7, #questionTab8, #questionTab9, #questionTab10, #questionTab11, #questionTab12").click(function(){
    $("#currentNumber").html($(this).html());
  });
});
*/



/*
$(document).ready(function(){
  $("#submitButton").click(function(){
    module[0] = new Question ($('#caseImage').val(), $('#clinicalInfo').val(), $('#question').val(), $('choiceA').val(), $('#explanationA').val(), $('choiceB').val(), $('#explanationB').val(), $('choiceC').val(), $('#explanationC').val(), $('choiceD').val(), $('#explanationD').val(), $('choiceE').val(), $('#explanationE').val());
    alert(modlue.length);
  });
});
*/



/*
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



