'use strict';

/**
 * The quiz object and uploadURL should be loaded in by the template when the page renders, just
 * doing this to make jshint happy
 */
var quiz = quiz,
    uploadURL = uploadURL,
    currentQuestion = null, // should use index (zero based) internally within script
    uploadKeyRoot = uploadKeyRoot,
    updateUploadKey = function(id){
      $('#uploadKey').val("uploads/temp/" + id + "/${filename}")
    }

/////////////////
// Initialize  //
/////////////////

$(document).ready(function() {
  
  registerEventHandlers()
  setupUpload()
  
  if (!quiz.questions || quiz.questions.length === 0){
    if (!quiz.questions){
      quiz.questions = []
    }
    addQuestion()
  } else {
    updateQuestionTabs()
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
    $("#questionRow").append('<tr><td class="questionTab">' + (i) + '</td></tr>');
  }

  $("#totalNumber").html(quiz.length);
}

var addQuestion = function(){
  var questionRowLength = $('#questionRow tr').length;

  $("#questionRow td").removeClass('clicked');
  $("#questionRow").append('<tr><td class="questionTab" class="clicked">' + (questionRowLength + 1) + '</td></tr>');

  quiz.questions.push(new Question())

  if (currentQuestion === null){
  // first question of quiz, don't need to save anything before loading
    goToQuestion(0)
  } else {
  // moving from existing question, save it before loading new question
    saveQuestion(function(){
      goToQuestion(quiz.questions.length - 1)
    })
  }
}

var removeQuestion = function(index){
  var questionRow = $('#questionRow tr');

  questionRow[index].remove()

  // get row again, without removed element (jquery .remove() doesn't remove the element
  // from the questionRow array)
  questionRow = $('#questionRow tr')

  quiz.questions.splice(index, 1)

  // renumber tabs
  questionRow.each(function(i){
    $(this).children(":first").html(i + 1)
  })

  goToQuestion(0)
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

  var question = quiz.questions[index]

  if (question.studyId){
    question.hasImage = true
    $('#hasImage').prop('checked', true)
    $('#hasImage').trigger('change')
  } else {
    question.hasImage = false
    $('#hasImage').prop('checked', false)
    $('#hasImage').trigger('change')
  }
  
  var updateDOM = function(){

        var choices = $('#choices'),
            image = $('#imagePreview')

        choices.empty()

        // load all choice DOM nodes
        if (question.choices){
          question.choices.forEach(function(choice, i){
            addChoice(i, choice.option, choice.explanation, choice.correct)
          })
        }

        // set form inputs to loaded values
        $('#clinicalInfo').val(question.clinicalInfo);
        $('#question').val(question.stem);
        $('#category').val(question.category);
        $('#difficulty').val(question.difficulty);
        $('#questionCategory').val(question.category);
        $('#diagnosis').val(question.diagnosis);

        if (question.studyId){

          $('#imageLabel').val(question.caseImage.imageStacks[0].label);
          $('#imageModality').val(question.caseImage.imageStacks[0].modality);
          $('#imageCategory').val(question.caseImage.category);

          var imageURL = question.caseImage.imageStacks[0].imagePaths[0] || 'http://placehold.it/512x512&text=No+image+for+this+case.'
          image.attr('src', imageURL)
        } else {

          // clear input fields
          $('#imageLabel').val('');
          $('#imageModality').val('');
          $('#imageCategory').val('');
          image.attr('src', 'http://placehold.it/512x512&text=No+image+for+this+case.')
        }

        // show/hide copyPrev button
        if (index > 0){
          $('#copyPrevious').show()
        } else {
          $('#copyPrevious').hide()
        }

      }

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
    // no image at all for this question yet

      // question.caseImage = new QuestionImage()
      updateDOM()
    }
  }
  else {
    updateDOM()
  }
}

var removeImageFromQuestion = function(cb){

  var question = quiz.questions[currentQuestion],
      studyId = question.studyId

  if (!studyId){
    console.log('No images for this question')
    return false
  }

  $.post('/api/removeImages', {_id: studyId})
    .done(function(res){
      console.log('removed images: ', res)

      // remove caseImage, studyId
      question.caseImage = null
      question.studyId = null

      if (cb){ cb(null, res) }
    })
    .fail(function(err){
      console.log('error removing images: ', err)
      window.alert('Error removing images.')
      if (cb){ cb(err) }
    })
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
  question.category = $('#category').val()
  question.difficulty = $('#difficulty').val()
  question.category = $('#questionCategory').val()
  question.diagnosis = $('#diagnosis').val()

  // only try to save images if question has images
  if (question.caseImage){

    question.caseImage.category = $('#imageCategory').val()
    question.caseImage.diagnosis = question.diagnosis
    question.caseImage.imageStacks[0].label = $('#imageLabel').val()
    question.caseImage.imageStacks[0].modality = $('#imageModality').val()

    var caseImageValidationErrors = isValidCaseImage(question.caseImage)

    if (caseImageValidationErrors.length > 0){
      var errors = caseImageValidationErrors.reduce(function(sum, error){ return sum + error + '\n' }, '')
      window.alert('The following fields are required: \n\n' + errors)
      if (cb){ return cb('Validation errors: ' + errors) }
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
  } else {
    if (cb){ cb(null, 'Saved') }
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
      getChar(index).toUpperCase() + '. <input id="choice'+index+'" class="form-control" value="'+option+'">'+
    '<br>'+
      'Explanation: <br> <textarea id="explanation'+index+'" class="form-control">'+
      explanation +
      '</textarea>'+
    '<br>'+
      'Is correct: <input type="radio" id="isCorrect'+index+'" name="isCorrect" value="'+index+'" '+correct+'>'+
      '<hr>'+
    '</li>')
}

var goToQuestion = function(index){

  currentQuestion = index

  loadQuestion(index)

  // add 'clicked' class to tab
  var questionTabs = $('#questionRow td')
  questionTabs.removeClass('clicked');
  $(questionTabs[index]).addClass('clicked');

  // update numbers
  $("#totalNumber").html(quiz.questions.length)
  $("#currentNumber").html(index + 1)
}

var isValidQuestion = function(index){

  var errors = [],
      question = quiz.questions[index]
  
  if (question.stem === ''){errors.push('Question')}
  if (question.choices.length < 1){errors.push('Need at least one answer choice')}

  if (question.hasImage){
    if (question.diagnosis === ''){errors.push('Diagnosis')}
  }

  return errors
}

var saveToServer = function(){

  saveQuestion()

  var errors = isValidQuestion(currentQuestion)

  if (errors.length === 0){

    // send quiz object to the server
    $.post('/api/saveQuiz', quiz)
      .done(function(res){
        console.log('Saved quiz to server ', res)

        // assign ids to questions if they don't have yet
        res.questions.forEach(function(question, i){
          if (!quiz.questions[i]._id){
            quiz.questions[i]._id = question
          }
        })

        $("#confirmationDiv").fadeIn(300).delay(200).fadeOut(300);
      })
      .fail(function(err){
        console.log('Error saving quiz to server: ', err)

        $("#failureDiv").fadeIn(300).delay(300).fadeOut(300);
      })
  } else {
    var errors = errors.reduce(function(sum, error){ return sum + error + '\n' }, '')
    window.alert('The following fields are required:\n\n' + errors)
  }
}


////////////////////
// Event handlers //
////////////////////

var registerEventHandlers = function(){

  /*$("#editQuestionbutton").click(function() {
    removeReadOnly();
  });*/

  $(".saveQuizButton").click(function() {

    // send quiz object to the server
    saveToServer()
    
  });

  $("#addQuestionbutton").click(function() {
    addQuestion()
  });

  $("#addChoiceButton").click(function() {
    addChoice()
  });

  // set question has image flag
  $("#hasImage").on('change', function(){
    
    var question = quiz.questions[currentQuestion]
    
    if ($(this).is(":checked")){
    // box checked
      
      if (!question.studyId){
        question.hasImage = true
        question.caseImage = new QuestionImage()

        // enable fields
        $('#image-form').show()
      } else {
      // probably switching to question with image already
        // enable fields
        $('#image-form').show()
      }

    } else {
    // box unchecked
      
      if (question.hasImage){

        if (window.confirm('Delete images from this question? This cannot be undone.')){
        // question has images and we're deleting them
          
          console.log('Delete images...')

          removeImageFromQuestion(function(err){
            if (err){ console.log(err) }
            
            question.hasImage = false

            // save
            saveToServer()

            // refresh DOM
            loadQuestion(currentQuestion)

            /*// disable fields
            $('#image-form').hide()*/
          })

        } else {

          if (question.studyId){
          // question has images, we canceled deleting them
            
            console.log('Cancel deleting images')

            question.hasImage = true
            $('#hasImage').prop('checked', true)

          } else {
            console.error('question.hasImage true while question.studyId false')
          } 
        }

      } else {
      // question doesn't have images, box not checked, probably loading question without images
        
        console.log('Loading question without images')

        question.hasImage = false
      
        // disable fields
        $('#image-form').hide()
      }
    }
  })

  $(document).on('click', '#questionRow td', function(event) {

    // set current question
    var clickedQuestion = parseInt($(event.target).html(), 10);

    // save current question, then load next
    saveQuestion(function(err){
      if (err){
        console.log(err)
      } else {
        goToQuestion(clickedQuestion - 1);
      }
    })
  });

  $(document).on('click', '#copyPrevious', function() {

    if (window.confirm('Copy previous question? This will overwrite anything you have written in this question.')){
      
      // copy data from previous question
      if (currentQuestion > 0){
        // clone object
        quiz.questions[currentQuestion] = JSON.parse(JSON.stringify(quiz.questions[currentQuestion - 1]))
        // remove question specific fields
        delete quiz.questions[currentQuestion].studyId
        delete quiz.questions[currentQuestion]._id
        delete quiz.questions[currentQuestion].createdAt
        delete quiz.questions[currentQuestion].updatedAt
        delete quiz.questions[currentQuestion].caseImage

        /*if (quiz.questions[currentQuestion].caseImage && quiz.questions[currentQuestion].caseImage.imageStacks[0]){
          delete quiz.questions[currentQuestion].caseImage.imageStacks[0]._id
          delete quiz.questions[currentQuestion].caseImage.imageStacks[0].id
          quiz.questions[currentQuestion].caseImage.imageStacks[0].imagePaths = []
        }*/

        // reload question
        loadQuestion(currentQuestion)
      }
    }
  })

  $(document).on('click', '#removeQuestion', function() {

    if (window.confirm('Delete question? This cannot be undone.')){
      
      if (quiz.questions[currentQuestion].studyId){

        // delete question
        $.post('/api/removeQuestion', quiz.questions[currentQuestion])
          .done(function(res){
            console.log('Removed question ', res)
            removeQuestion(currentQuestion)
          })
          .fail(function(err){
            console.log('Question could not be removed. ', err)
          })
      }
      else {

        // nothing to delete from server, just remove from quiz object
        removeQuestion(currentQuestion)
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


//////////////////
// Constructors //
//////////////////

// Probably should do more with these constructors,
// i.e. attach 'save' and other methods directly to them

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
	this.caseImage = caseImage || null//new QuestionImage({category: category, diagnosis: diagnosis})
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


///////////////
// Uploading //
///////////////

var setupUpload = function(){

  $('#uploadImages').on('click', function(){

    // save any changes to the quiz object, this should also get an image
    // container if we don't have one already
    saveQuestion(function(err){
      if (err){
        return false
      }
      else {

        var questionStudy = quiz.questions[currentQuestion].caseImage,
        studyId = quiz.questions[currentQuestion].studyId

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
      }
    })
  })

  $('#clearQueue').on('click', function(){
    dropzone.removeAllFiles()
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
}
