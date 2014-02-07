



$(document).ready(function(){
	$("#submitButton").click(function(){
		confirm("Submit this question?");
	});
});


/**
 *  Some thoughts:
 *
 * You should only need one $(document).ready(function(){ ... }) call in your entire script,
 * often times that will just surround the entire script to keep it from running until the DOM is ready.
 *
 * for the question object, what I was trying to say today would be like:
 * var quiz = {
 *   'title': '',
 *   'questions': [
 *     {
 *       'stem': '',
 *       'options': [
 *         {'option': 'atelectasis', correct: false},
 *         {'option': 'cancer', correct: true},
 *         {'option': 'whatever', correct: false}
 *       ],
 *       'explanation': ''
 *     },
 *     {
 *       'stem': '',
 *       'options': [
 *         {'option': 'atelectasis', correct: false},
 *         {'option': 'cancer', correct: true},
 *         {'option': 'whatever', correct: false}
 *       ],
 *       'explanation': ''
 *     },
 *     ...
 *   ]
 * }
 *
 * Then, each time the user saves/deletes a new question, you just add/remove it from the 'questions' array
 * and send the whole object back to the server.
 *
 * You can access different questions using the index, i.e. quiz.questions[1].options
 * (gives array of option objects)
 *
 * Hope that makes some sense
 */





var caseImage = ["http://upload.wikimedia.org/wikipedia/commons/2/22/Scaphoid_waist_fracture.gif", 
  "http://sfghed.ucsf.edu/Education/ClinicImages/Dorsal%20radial%20styloid%20perilunate%20dislocation-lateral.jpg",
  "http://images.radiopaedia.org/images/1556014/209e2f382decd37a71e182509cbf05.jpg"]
var clinicalInfo = ["CI1", "CI2", "CI3"]
var questions = ["1?", "2?", "3?"]
var choiceA = ["choiceA1", "choiceA2", "choiceA3"]
var explanationA = ["explA1", "explA2", "explA3"]
var choiceB = ["choiceB1", "choiceB2", "choiceB3"]
var explanationB = ["explB1", "explB2", "explB3"]
var choiceC = ["choiceC1", "choiceC2", "choiceC3"]
var explanationC = ["explC1", "explC2", "explC3"]
var choiceD = ["choiceD1", "choiceD2", "choiceD3"]
var explanationD = ["explD1", "explD2", "explD3"]
var choiceE = ["choiceE1", "choiceE2", "choiceE3"]
var explanationE = ["explE1", "explE2", "explE3"]
var diagnosis = ["1 scaphoid fracture", "2 perilunate dislocation", "3 triquetral fracture"]
var keywords = []



$(document).ready(function(){
  var questionRowLength = $('#questionRow tr').length;
  $("#totalNumber").html(questionRowLength);
});


$(document).ready(function(){
  $("#addQuestionbutton").click(function(){
    var questionRowLength = $('#questionRow tr').length;
    $("#questionRow").append('<tr><td id="questionTab">' + (questionRowLength + 1) + '</td></tr>');
    var questionRowLength = questionRowLength + 1;
    $("#totalNumber").html(questionRowLength);
  });
});



$(document).ready(function(){
  $("#questionTab1, #questionTab2, #questionTab3").click(function(){
    $("#currentNumber").html($(this).html());
  });
});





/*

$('#questionRow tr').length;


$(document).ready(function(){
  $("#questionTab2").click(function(){
    var currentNumber = $(this).text();
      $("#currentNumber").replaceWith(currentNumber);
      $("#totalNumber").replaceWith(numberOfQuestions);
});
});


var questionRow = []


$(document).ready(function(){
  for (var i = 0; i < numberOfQuestions; i++) {
    questionRow=questionRow + '<tr><td id="questionTab+">' + i + '</td></tr>';
  });
});

$(document).ready(function(){
    $("#questionNav").click(function(){
        $("#questionRow").append(questionRow);
});
});

#questionRow
*/






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


