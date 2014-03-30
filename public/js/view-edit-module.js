'use strict';

/**
 * The quiz object and uploadURL should be loaded in by the template when the page renders, just
 * doing this to make jshint happy
 */
var quiz = quiz,
    uploadURL = uploadURL,
    currentQuestion = null, // should use index (zero based) internally within script
    updateUploadKey = function(id){
      $('#uploadKey').val("uploads/temp/" + id + "/${filename}")
    }

/////////////////
// Initialize  //
/////////////////

$(document).ready(function() {

	updateQuestionTabs()

  registerEventHandlers()

  setupUpload()

  if (quiz.questions.length === 0){
    addQuestion()
  } else {
    goToQuestion(0)
  }

  /*var imageHeight = $('#imagepreviewDiv img').height();
  if (imageHeight < 540) {
    var margintop = (540 - imageHeight) / 2;
    $('#imagepreviewDiv img').css('margin-top', margintop);
  }*/
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

  saveQuestion(function(){
    goToQuestion(quiz.questions.length - 1)
  })
}

var _loadCaseImage = function(studyId, cb){

  $.getJSON('/api/getImageObject/' + studyId)
    .done(function(res){
      console.log('loaded: ', res)
      cb(null, res)
    })
    .fail(function(err){
      cb(err)
    })
}

var loadQuestion = function(index){

  var question = quiz.questions[index],
      updateDOM = function(){

        var choices = $('#choices'),
            image = $('#imagePreview')

        choices.empty()

        question.choices.forEach(function(choice, i){
          addChoice(i, choice.option, choice.explanation, choice.correct)
        })

        $('#clinicalInfo').val(question.clinicalInfo);
        $('#question').val(question.stem);
        $('#diagnosis').val(question.diagnosis);
        $('#category').val(question.category);
        $('#difficulty').val(question.difficulty);
        $('#questionCategory').val(question.category);

        $('#imageLabel').val(question.caseImage.imageStacks[0].label);
        $('#imageModality').val(question.caseImage.imageStacks[0].modality);
        $('#imageCategory').val(question.caseImage.category);

        var imageURL = question.caseImage.imageStacks[0].imagePaths[0] || 'http://placehold.it/512x512&text=No+image+for+this+case.'
        image.attr('src', imageURL)

        // show/hide copyPrev button
        if (index > 0){
          $('#copyPrevious').show()
        } else {
          $('#copyPrevious').hide()
        }
      };

  if (typeof question.caseImage === "undefined"){

    // if the question has .studyId defined, then there's an image
    // study already saved in casefiles- load it in
    if (question.studyId){

      _loadCaseImage(question.studyId, function(err, caseImage){
        if (err){
          console.log(err)
          return window.alert('There was an error loading the image for this question.')
        }

        question.caseImage = new QuestionImage(caseImage)
        updateDOM()
      })
    }
    else {

      question.caseImage = new QuestionImage()
      updateDOM()
    }
  }
  else {
    updateDOM()
  }
}

var isValidCaseImage = function(caseImage){
  var errors = []
  if (caseImage.diagnosis === ''){errors.push('Diagnosis')}
  if (caseImage.category === ''){errors.push('Category')}
  if (caseImage.imageStacks[0].modality === ''){errors.push('Modality')}

  return errors
}

var saveQuestion = function(index, cb){

  if (typeof index === "function"){
    cb = index
    index = null
  }

  index = index || currentQuestion

  var question = quiz.questions[index]

  question.clinicalInfo = $('#clinicalInfo').val()
  question.stem = $('#question').val()
  question.choices = getChoices()
  question.diagnosis = $('#diagnosis').val()
  question.category = $('#category').val()
  question.difficulty = $('#difficulty').val()
  question.category = $('#questionCategory').val()

  question.caseImage.category = $('#imageCategory').val()
  question.caseImage.diagnosis = question.diagnosis
  question.caseImage.imageStacks[0].label = $('#imageLabel').val()
  question.caseImage.imageStacks[0].modality = $('#imageModality').val()

  var caseImageValidationErrors = isValidCaseImage(question.caseImage)

  if (caseImageValidationErrors.length > 0){
    var errors = caseImageValidationErrors.reduce(function(sum, error){ return sum + error + '\n' }, '')
    window.alert('The following fields are required: \n\n' + errors)
  } else {

    var sendObj = {
      studyId: question.studyId,
      studyObj: question.caseImage
    }

    $.post('/api/saveImages', sendObj)
      .done(function(res){
        console.log('saved images: ', res)

        if (res._id && question.studyId && res._id !== question.studyId){ console.log('IDs do not match') }

        // add images study id if not already set
        if (!question.studyId && res._id){
          question.studyId = res._id
          console.log('studyId set to ', question.studyId)
        }

        if (cb){ cb(null, res) }
      })
      .fail(function(err){
        console.log('error saving images: ', err)
        window.alert('Error saving images.')
        if (cb){ cb(err) }
      })
  }
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

var saveToServer = function(){

  saveQuestion()

  // send quiz object to the server
  $.post('/api/saveQuiz', quiz)
    .done(function(res){
      console.log('Saved quiz to server ', res)

      $("#confirmationDiv").fadeIn(300).delay(200).fadeOut(300);
    })
    .fail(function(err){
      console.log('Error saving quiz to server: ', err)

      $("#failureDiv").fadeIn(300).delay(300).fadeOut(300);
    })
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

    // send quiz object to the server
    saveToServer()
    
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

    // save current question, then load next
    saveQuestion(function(){
      goToQuestion(clickedQuestion - 1);
    })
  });

  $(document).on('click', '#copyPrevious', function() {

    if (confirm('Copy previous question? This will overwrite anything you have written in this question.')){
      
      // copy data from previous question
      if (currentQuestion > 0){
        // clone object
        quiz.questions[currentQuestion] = JSON.parse(JSON.stringify(quiz.questions[currentQuestion - 1]))
        // remove uploaded image paths
        quiz.questions[currentQuestion].caseImage.imageStacks[0].imagePaths = []
        // reload question
        loadQuestion(currentQuestion)
      }
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
 * Question object constructor
 * @param {String} caseImage    ID of study images
 * @param {String} clinicalInfo History (optional)
 * @param {String} stem         Question stem
 * @param {Array} choices      Array of answer choices
 * @param {String} category
 * @param {Number} difficulty
 */
function Question(caseImage, studyId, clinicalInfo, stem, choices, diagnosis, category, difficulty) {
	this.caseImage = caseImage || new QuestionImage({category: category, diagnosis: diagnosis})
  this.studyId = studyId || '';
	this.clinicalInfo = clinicalInfo || '';
	this.stem = stem || ''; // changed this from this.question to match the database model that is set up, also to not confuse a question object with question parameter i.e. "question.question"
	this.choices = choices || [];

	// adding a few properties that we might want to store as well
  this.diagnosis = diagnosis || '';
	this.category = category || '';
  this.difficulty = difficulty || 1;
}

function QuestionImage(obj){

  obj = obj || {}

  this.category = obj.category || ''
  this.diagnosis = obj.diagnosis || ''
  
  // array of objects, each object represents one series of images
  // for now, only use one element until viewing multiple series is supported
  // that's why for now it's always caseImage.imageStacks[0] elsewhere in the code
  this.imageStacks = obj.imageStacks || [
      {
        label: '',
        modality: '',
        imagePaths: [] // array of image urls
      }
    ]
}

var setupUpload = function(){

  $('#uploadImages').on('click', function(){

    // save any changes to the quiz object
    saveQuestion()

    var questionStudy = quiz.questions[currentQuestion].caseImage,
        studyId = quiz.questions[currentQuestion].studyId

    // see if study has id already (has been saved in the past), otherwise,
    // save the object to get an id
    if (studyId){

      updateUploadKey(studyId)

      // if there are images already, delete them
      if (questionStudy.imageStacks[0].imagePaths.length > 0){
        $.post('/api/clearImages', {studyId: studyId})
          .done(function(res){

            console.log('Images deleted from server', res)

            // images deleted from server
            questionStudy.imageStacks[0].imagePaths = []

            // go ahead and trigger upload
            dropzone.processQueue()
          })
          .fail(function(err){
            console.log(err)
          })
      } else {
        // empty container exists, start upload
        dropzone.processQueue()
      }
    } else {
      // get container for images first so we know where to upload to
      $.post('/api/saveImages', {studyId: false, studyObj: questionStudy})
        .done(function(res){
          console.log('Created image container: ', res)

          if (res._id){

            // add id, process upload
            studyId = res._id

            updateUploadKey(studyId)

            dropzone.processQueue()
          } else {
            console.log('There was an error saving the Image data.')
          }
        })
        .fail(function(err){
          console.log('FAIL', err)
        })
    }
  })

  var newImagePaths = []

  Dropzone.autoDiscover = false
  var dropzone = new Dropzone('.dropzone', {
      url: uploadURL,
      maxFilesize: 100,
      maxFiles: 1,
      paramName: 'file',
      maxThumbnailFilesize: 5,
      autoProcessQueue: false,
      thumbnailWidth: 200,
      thumbnailHeight: 200,
      dictDefaultMessage: '<div class="msg-primary">Drop files here to upload</div><div class="msg-secondary">(or click)</div>'
    })
    .on('addedfile', function(file){
      $(file.previewElement).find('.dz-success-mark,.dz-error-mark').hide()

      // just overwrite previous file if adding more than one
      if (this.files[1]!=null){
        this.removeFile(this.files[0]);
      }
    })
    .on("maxfilesexceeded", function(file) { 
      this.removeFile(file)
    })
    .on('totaluploadprogress', function(total, totalBytes, totalBytesSent){
      console.log(total)
    })
    .on('error', function(file, error){
      console.log('error: ', error)
    })
    .on('success', function(file, response){
      if (response.indexOf('Location') === -1){
        return console.log('error: ', response)
      }
      var imageURL = response.split('Location')[1].slice(1, -2)
      console.log('Saved image to: ', imageURL)

      // push url into array
      newImagePaths.push(imageURL)
      
      $(file.previewElement).find('.dz-success-mark').show()

      if (this.getUploadingFiles().length > 0){
        this.processQueue()
      } else {
        onAllUploaded()
      }
    })

    var onAllUploaded = function(){
      console.log('complete')

      var question = quiz.questions[currentQuestion]

      // set new imagePaths on quiz object
      question.caseImage.imageStacks[0].imagePaths = newImagePaths

      // refresh DOM to display new image
      loadQuestion(currentQuestion)

      // clear array for next time
      newImagePaths = []
      dropzone.removeAllFiles()

      // probably should auto-save quiz to server here
      saveToServer()
    }
    /*.on('complete',function(){
      if (this.getUploadingFiles().length > 0){
        this.processQueue()
        return false
      }
      
      console.log('complete')

      var question = quiz.questions[currentQuestion]

      // set new imagePaths on quiz object
      question.caseImage.imageStacks[0].imagePaths = newImagePaths

      // refresh DOM to display new image
      loadQuestion(currentQuestion)

      // clear array for next time
      newImagePaths = []
      dropzone.removeAllFiles()

      // probably should auto-save quiz to server here
      saveToServer()
    })*/
}
