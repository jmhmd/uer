'use strict';

/**
 * The quiz object should be loaded in by the template when the page renders, just
 * doing this to make jshint happy
 */
var quiz = quiz,
    currentQuestion = null // should use index (zero based) internally within script

/////////////////
// Initialize  //
/////////////////

$(document).ready(function() {

	updateQuestionTabs()

  registerEventHandlers()

  if (quiz.questions.length === 0){
    addQuestion()
  } else {
    goToQuestion(0)
  }

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
  }

  $("#totalNumber").html(quiz.length);
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
    addChoice(i, choice.option, choice.explanation, choice.correct)
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

        var correct = parseInt($('input:radio[name=isCorrect]:checked').val(), 10)

        return {
          option: choice.find('#choice'+i).val(),
          explanation: choice.find('#explanation'+i).val(),
          correct:  correct === i
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
  if (currentQuestion !== null){
    saveQuestion()
  }

  // load new question into form
  loadQuestion(index)

  currentQuestion = index

  // add 'clicked' class to tab
  var questionTabs = $('#questionRow td')
  questionTabs.removeClass('clicked');
  $(questionTabs[index]).addClass('clicked');

  // update numbers
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
  });

  $("#addQuestionbutton").click(function() {
    addQuestion()
  });

  $("#addChoiceButton").click(function() {

    addChoice()
  });

  $(document).on('click', '#questionRow td', function(event) {

    // set current question
    var clickedQuestion = parseInt($(event.target).html(), 10);

    goToQuestion(clickedQuestion - 1);
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

var imageHeight = $('#imagepreviewDiv img').height();
if (imageHeight < 540) {
	var margintop = (540 - imageHeight) / 2;
	$('#imagepreviewDiv img').css('margin-top', margintop);
}

$('#uploadImages').on('click', function(){
  // make sure images have id
  if (images._id){
    dropzone.processQueue()
  } else {
    // get container for images first
    $.post('/api/saveImages', images)
      .done(function(res){
        console.log('response: ', res)
      })
      .fail(function(err){
        console.log('FAIL', err)
      })
  }
})

Dropzone.autoDiscover = false
var dropzone = new Dropzone('.dropzone', {
    url: '{{s3.s3URL}}',
    maxFilesize: 100,
    paramName: 'file',
    maxThumbnailFilesize: 5,
    autoProcessQueue: false,
    dictDefaultMessage: '<div class="msg-primary">Drop files here to upload</div><div class="msg-secondary">(or click)</div>'
  })
  .on('addedfile', function(file){
    $(file.previewElement).find('.dz-success-mark,.dz-error-mark').hide()
  })
  .on('totaluploadprogress', function(total, totalBytes, totalBytesSent){
    console.log(total)
  })
  .on('error', function(file, error){
    console.log('error: ', error)
  })
  .on('success', function(file, response){
    response = response.split('Location')[1].slice(1, -2)
    console.log(response)
    $(file.previewElement).find('.dz-success-mark').show()
  })
  .on('complete',function(){
    if (this.getUploadingFiles().length > 0){
      this.processQueue()
      return false
    }
    console.log('complete')
  })
