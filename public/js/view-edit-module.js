//'use strict';

/**
 * The quiz object should be loaded in by the template when the page renders, just
 * doing this to make jshint happy
 */
var quiz = quiz,
    currentQuestion = 0 // should use index (zero based) internally within script

/////////////////
// Initialize  //
/////////////////

$(document).ready(function() {

	updateQuestionTabs()

  registerEventHandlers()

  addQuestion()

});

///////////////////
// DOM functions //
///////////////////

var updateQuestionTabs = function(){

  var questionRow = $("#questionRow")

  // clear all
  questionRow.empty()
  
  // repopulate
  for (var i = 1; i <= quiz.questions.length; i++) {
    $("#questionRow").append('<tr><td id="questionTab">' + (i) + '</td></tr>');
    //var questionRowLength = $('#questionRow tr').length;
    var questionRowLength = quiz.length;
    $("#totalNumber").html(questionRowLength);
  }
}

var addReadOnly = function() {
  $('textarea, input').prop('readonly', true);
  $('textarea, input').css("color", "#686868");
  $('textarea, input').css("background-color", "#C8C8C8");
  $('#textfields, #moretextfields').css("color", "#686868");
};


var removeReadOnly = function() {
  $('textarea, input').removeAttr('readonly');
  $('textarea, input').css("color", "black");
  $('textarea, input').css("background-color", "white");
  $('#textfields, #moretextfields').css("color", "black");
};

var addQuestion = function(){
  var questionRowLength = $('#questionRow tr').length;

  $("#questionRow td").removeClass('clicked');
  $("#questionRow").append('<tr><td id="questionTab" class="clicked">' + (questionRowLength + 1) + '</td></tr>');

  quiz.questions.push(new Question())

  goToQuestion(quiz.questions.length - 1)
}

var loadQuestion = function(index){

  var question = quiz.questions[index];

  $('#clinicalInfo').val(question.clinicalInfo);
  $('#question').val(question.stem);
  $('#diagnosis').val(question.diagnosis);
  $('#category').val(question.category);
  $('#difficulty').val(question.difficulty);

  var choices = $('#choices')

  choices.empty()

  question.choices.forEach(function(choice, i){
    addChoice(i, choice.option, choice.explanation)
  })
}

var saveQuestion = function(index){

  index = index || currentQuestion

  var question = quiz.questions[index]
 
  question.clinicalInfo = $('#clinicalInfo').val()
  question.stem = $('#question').val()
  question.choices = getChoices()
  question.diagnosis = $('#diagnosis').val()
  question.category = $('#category').val()
  question.difficulty = $('#difficulty').val()
}

var getChoices = function(){

  return $('.choice').map(function(i, choice){

        choice = $(choice)

        return {
          option: choice.find('#choice'+i).val(),
          explanation: choice.find('#explanation'+i).val(),
          correct: parseInt(choice.find('#isCorrect'+i).val(), 10) === i
        }
      }).get()
}

var addChoice = function(index, option, explanation, correct){

  var choiceContainer = $('#choices')

  index = index || choiceContainer.find('.choice').length
  option = option || ''
  explanation = explanation || ''

  correct = correct ? "checked" : ""

  choiceContainer.append('<li class="choice">'+
      getChar(index).toUpperCase() + '. <textarea id="choice'+index+'" style="width:400px; height:16px;">'+
      option +
      '</textarea>'+
    '<br>'+
      'Explanation: <textarea id="explanation'+index+'" style="width:600px; height:40px;">'+
      explanation +
      '</textarea>'+
    '<br>'+
      'Is correct: <input type="radio" id="isCorrect'+index+'" name="isCorrect" value="'+index+'" '+correct+'>'+
    '</li>')
}

var goToQuestion = function(index){

  // save current question
  saveQuestion()

  // load new question into form
  loadQuestion(index)

  currentQuestion = index

  // update display
  $("#totalNumber").html(quiz.questions.length)
  $("#currentNumber").html(index + 1)
}


////////////////////
// Event handlers //
////////////////////

var registerEventHandlers = function(){

  $("#editQuestionbutton").click(function() {
    removeReadOnly();
  });

  /**
   * Save quiz
   */

  $("#submitButton").click(function() {

    if (!window.confirm("Save Quiz?")){
      return false
    }
    
    // make sure current question is saved
    saveQuestion()

    // send quiz object to the server
    $.post('/api/saveQuiz', quiz)
      .done(function(res){
        console.log(res)

        $("#confirmationDiv").fadeIn(300).delay(200).fadeOut(300);
      })
      .fail(function(err){
        console.log(err)

        $("#failureDiv").fadeIn(300).delay(300).fadeOut(300);
      })

    /*if (quiz.length > 0) {
      $("#confirmationDiv").fadeIn(300).delay(200).fadeOut(300);
    } else {
      $("#failureDiv").fadeIn(300).delay(300).fadeOut(300);
    }*/

    /*var next = $("#questionRow td.clicked").parent().next().children('td');
    $("#questionRow td").removeClass('clicked');
    next.addClass('clicked');

    $("#currentNumber").html($('#questionRow td.clicked').html());

    addReadOnly();*/

    /*    var alertData = []
    $.each(quiz[insertSpot], function(index, value) {
    alertData.push(index + ': ' + value);
    });
    alert(JSON.stringify(alertData));*/

  });

  $("#addQuestionbutton").click(function() {
    addQuestion()
  });

  $("#addChoiceButton").click(function() {
    
    addChoice()
  });

  $(document).on('click', '#questionRow td', function() {

    // add 'clicked' class
    $('#questionRow td').removeClass('clicked');
    $(this).addClass('clicked');


    // set current question
    var clickedQuestion = parseInt($('#questionRow td.clicked').html(), 10);

    goToQuestion(clickedQuestion - 1);

    /*
    This is where to look in the quiz array if a corresponding object already exists there.
    */

    /*if (quiz.length >= currentSpot) {
      function populate(frm, data) {
        $.each(data, function(key, value) {
          $('[name=' + key + ']', frm).val(value);
        });
      }

      populate('#form1', $.parseJSON(quiz[currentSpot - 1]));
    }*/


    /*function populate(frm, data) {
          $.each(quiz[0], function(key, value){
          $('[name='+key+']', frm).val(value);
           });
          }

          populate('#form1', $.parseJSON(quiz[0]));
        */


    /*    var alertData = []
        $.each(quiz[insertSpot], function(index, value) {
        alertData.push(index + ': ' + value);
        });
        alert(JSON.stringify(alertData));
        */


    /*var quizSearchSpot = parseInt($('#currentNumber').html(), 10) - 1;
        if(quiz[quizSearchSpot].length > 0) {
          addReadOnly;} else {
            removeReadOnly;
        */
  });

  $(document).on('click', '#copyPrevious', function() {

    // load data from previous question into form
    if (currentQuestion > 0){
      loadQuestion(currentQuestion - 1)
    }
  })
}

//////////////////////
// Helper functions //
//////////////////////

function getChar(n) {
  n = parseInt(n, 10);
  var s = "";
  while(n >= 0) {
    s = String.fromCharCode(n % 26 + 97) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

/*
var alertData = []
$.each(quiz[0], function(index, value) {
    alertData.push(index + ': ' + value);
});
alert(JSON.stringify(alertData));


var myData = $(quiz[0])   //.serialize();//
alert(myData);
*/



/*
Trying to populate form with pre-existing quiz data as retrieved from the server.
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

/**
 * Nice choice to use a constructor here. However, you'll want to be able to pass it
 * an arbitrary number of choices, so passing it an array as an argument might be a
 * more flexible solution. Then we can use loops elsewhere to perform whatever action
 * on the choices array regardless of length.
 */

/**
 * Question object constructor
 * @param {String} caseImage    ID of study images
 * @param {String} clinicalInfo History (optional)
 * @param {String} stem         Question stem
 * @param {Array} choices      Array of answer choices
 * @param {String} category     
 * @param {Number} difficulty 
 */
function Question(caseImage, clinicalInfo, stem, choices, diagnosis, category, difficulty) {
	this.caseImage = caseImage || false;
	this.clinicalInfo = clinicalInfo || '';
	this.stem = stem || ''; // changed this from this.question to match the database model that is set up, also to not confuse a question object with question parameter i.e. "question.question"
	this.choices = choices || [];

	// adding a few properties that we might want to store as well
  this.diagnosis = diagnosis || ''; 
	this.category = category || '';
  this.difficulty = difficulty || 1;
}

/*function Question(caseImage, clinicalInfo, question, choiceA, explanationA, choiceB, explanationB, choiceC, explanationC, choiceD, explanationD, choiceE, explanationE) {
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
};*/

/*
 $(document).ready(function() {
     $(document).on('change', 'input:file', function(event) {
       $.post("addNewImage.asp",((parseInt($('#currentNumber').html(), 10) - 1), "#quizName".html()), function(status, result){
          if (status == "success"){
            $("#imagePreview").attr('src', result);
            $('#caseImage').attr('readonly');
          };
     });
  });
*/

/*
Probably won't need this as the above seems to generally work, but it depends on whether or not I can get the quiz[] area to equal 
a dynamic value based on which question number is clicked so that it adds to that spot in the quiz array.

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
    quiz.push(questionBeingAdded);
    confirm(quiz.length);
    };
	});
});
*/


// on.(event(function()) may be useful in the future //  



/*
Something like if class == 'clicked' then get html data from that row and parse it to interval to place in quiz [_], to retrieve
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


//  $.each(quiz[0], function(i,val) { $('#'+ i).val(val); //


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
//get data from quiz[td which has class clicked (probably through html content using parseInt)] and fill in the form//


/*$(document).ready(function() {
	var questionRowLength = $('#questionRow tr').length;
	$("#totalNumber").html(questionRowLength);
});*/

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
    quiz[0] = new Question ($('#caseImage').val(), $('#clinicalInfo').val(), $('#question').val(), $('choiceA').val(), $('#explanationA').val(), $('choiceB').val(), $('#explanationB').val(), $('choiceC').val(), $('#explanationC').val(), $('choiceD').val(), $('#explanationD').val(), $('choiceE').val(), $('#explanationE').val());
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
  $("#viewquizs").click(function(){
    $("#currentquizs").slideToggle("slow");
  });
});
*/