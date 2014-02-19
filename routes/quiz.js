'use strict';

var util = require('util'),
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Quiz = mongoose.model('Quiz'),
	Question = mongoose.model('Question'),
	QuizResult = mongoose.model('QuizResult'),
	validator = require('validator'),
	request = require('request'),
	casefiles = require('../config/secrets').casefiles

/**
 * show page for quiz overview (start)
 * @param  {string} quizId
 */
exports.showQuiz = function(req, res, next){
	
	var quizId = req.params.quizId
	
	// get quiz object and render template
	Quiz
	.findById(quizId)
	.populate('questions')
	.exec(function(err, quiz){

		if (err){ return next(err) }

		// render template
		res.render('quiz', quiz)
	})
}

/**
 * show page for quiz editing
 * @param  {string} quizId
 */
exports.showQuizEdit = function(req, res, next){
	
	var quizId = req.params.quizId

	if (quizId !== 'new'){

		// get quiz object and render template
		Quiz
		.findById(quizId)
		.populate('questions')
		.exec(function(err, quiz){

			if (err){ return next(err) }

			// render template
			res.render('editQuiz', quiz)
		})
	} else {
		res.render('editQuiz')
	}
	
}

/**
 * show page for individual question
 * @param  {string}   quizId
 * @param  {string}   questionId
 */
exports.showQuestion = function(req, res, next){

	var questionId = req.params.questionId
	
	// get question object and render template
	Question
	.findById(questionId)
	.exec(function(err, question){

		if (err){ return next(err) }

		// render template
		res.render('question', question)
	})
}

/**
 * Show aggregated quiz results, comparisons, etc
 * @param  {string}   quizId
 */
exports.showResults = function(req, res, next){

	var quizResultId = req.params.quizResultId
	
	// get question object and render template
	QuizResult
	.findById(quizResultId)
	.exec(function(err, quizResult){

		if (err){ return next(err) }

		/**
		 * @todo Pull in all other answers to each question to calculate
		 *       percent right/wrong, and calculate overall quiz performance
		 *       for all users
		 */

		// render template
		res.render('quizResults', quizResult)
	})
}

///////////////////////
// Private functions //
///////////////////////

var _updateQuizObject = function(quiz, newQuiz){
	quiz.title = newQuiz.title
	quiz.difficulty = newQuiz.difficulty
	quiz.questions = newQuiz.questions

	return quiz
}

var _updateQuestionObject = function(question, newQuestion){
	question.stem = newQuestion.stem
	question.answers = newQuestion.answers
	question.category = newQuestion.category
	question.studyId = newQuestion.studyId

	return question
}


////////////////////
// Quiz functions //
////////////////////

exports.getQuiz = function(req,res){

	/**
	 * Read quiz object from db
	 */
	var quizId = req.params.quizId

	if (!quizId){ return res.send(400, 'Quiz Id is required') }

	Quiz.findById(quizId)
		.populate('questions')
		.exec(function(err, quiz){
			if (err){ return res.send(500, err) }
			if (!quiz){ return res.send(404, 'Quiz not found') }

			return res.send(200, quiz)
		})
}

exports.saveQuiz = function(req, res){

	/**
	 * Updating an existing case
	 */
	if (req.body._id){

		Quiz.findById(req.body._id, function(err, quiz){

			quiz = _updateQuizObject(quiz, req.body)

			quiz.save(function(err){
				if (err){ return res.send(500, err) }
				res.send(200, quiz)
			})
		})
	}

	/**
	 * Saving a new case
	 */
	else {
		var	quiz = new Quiz(req.body);
	
		quiz.save(function(err){
			if(err){
				return res.send(500, err)
			}
			res.send(201, quiz)
		})
	}
}

exports.removeQuiz = function(req, res){
	Quiz.findById(req.body._id).remove(function(err){
		if (err){ return res.send(500, err) }
		res.send(200, 'Quiz removed')
	})
}


////////////////////////
// Question functions //
////////////////////////

exports.getQuestion = function(req,res){

	/**
	 * Read question object from db
	 */
	var questionId = req.params.questionId

	if (!questionId){ return res.send(400, 'Question Id is required') }

	Question.findById(questionId)
		.populate('questions')
		.exec(function(err, question){
			if (err){ return res.send(500, err) }
			if (!question){ return res.send(404, 'Question not found') }

			return res.send(200, question)
		})
}

exports.saveQuestion = function(req, res){
	/**
	 * Updating an existing question
	 */
	if (req.body._id){

		Question.findById(req.body._id, function(err, question){

			question = _updateQuestionObject(question, req.body)

			question.save(function(err){
				if (err){ return res.send(500, err) }
				res.send(200, question)
			})
		})
	}

	/**
	 * Saving a new question
	 */
	else {
		var	question = new Question(req.body);
	
		question.save(function(err){
			if(err){
				return res.send(500, err)
			}
			res.send(201, question)
		})
	}
}

exports.removeQuestion = function(req, res){
	Question.findById(req.body._id).remove(function(err){
		if (err){ return res.send(500, err) }
		res.send(200, 'Question removed')
	})
}

/**
 * Send images to casefiles as a study object
 * @param  {Object} req.body:
 *         	{
 *         		diagnosis: String,
 * 	        	category: String, // available categories: 
													'Thoracic',
													'Abdominal',
													'Interventional',
													'Breast',
													'Musculoskeletal',
													'Neuroradiology',
													'Nuclear Medicine',
													'Pediatric',
													'Trauma',
													'Other'
				imageStacks: [ // array of objects, each object represents one series of images
					{
						label: String,
						modality: String, // available modalities:
																'CT',
																'MRI',
																'Ultrasound',
																'Fluoroscopy',
																'X-ray plain',
																'Mammography',
																'PET',
																'SPECT',
																'Other'
						imagePaths: [] // array of image urls
					}
				]
 *  		}
 */
exports.saveImages = function(req, res){

	/**
	 * Validate case before trying to save
	 */
	
	var errors, loopErrors = false

	req.checkBody('diagnosis', 'Must include diagnosis').notEmpty()
	req.checkBody('category', 'Must include category').notEmpty()

	errors = req.validationErrors()

	if (req.body.imageStacks.length > 0){
		_.each(req.body.imageStacks, function(stack, i){
			if (!validator.isLength(stack.modality, 1)){
				if (!errors){ errors = [] }
				errors.push({param: 'modality', msg: 'modality required', value: stack.modality })
			}
			/*if (!stack.imagePaths || stack.imagePaths.length < 1){
				if (!errors){ errors = [] }
				errors.push({param: 'imageStacks['+i+'].imagePaths', msg: 'No images are included', value: stack.imagePaths })
			}*/
		})
	}
	
	if (errors || loopErrors) {
		var message = 'There have been validation errors: ' + util.inspect(errors)
		res.send(400, message)
		return
	}

	/**
	 * Send case to casefiles
	 */
		
	request.post({
			url: casefiles.url + 'api/client/saveStudy',
			json: {
				email: req.user.email,
				apikey: casefiles.apikey,
				study: req.body
			}
		},
		function(err, response, body) {
			if (err) {
				return res.send(500, err)
			}

			console.log('result:', body, body._id)

			res.send(200, body)
		})
}

/**
 * Delete study from casefiles
 * Required:
 * body._id // id of study being removed
 */
exports.removeImages = function(req, res){
	/**
	 * Send case to casefiles
	 */
		
	request.post({
			url: casefiles.url + 'api/client/removeStudy',
			json: {
				apikey: casefiles.apikey,
				studyId: req.body._id
			}
		},
		function(err, response, body) {
			if (err) {
				return res.send(500, err)
			}
			res.send(200, body)
		})
}