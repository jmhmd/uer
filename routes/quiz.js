'use strict';

var util = require('util'),
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Quiz = mongoose.model('Quiz'),
	Question = mongoose.model('Question'),
	QuizResult = mongoose.model('QuizResult'),
	validator = require('validator'),
	request = require('request'),
	casefiles = require('../config/secrets').casefiles,
	async = require('async')

/**
 * show page to list quizzes
 */
exports.showQuizList = function(req, res, next){

	/**
	 * Get list of quizzes meeting criteria
	 */
	Quiz.find()
		.limit(50)
		.exec(function(err, quizzes){
			if (err){ return next(err) }

			if (quizzes.length === 0){
				res.flash('info', {msg: 'No quizzes found.'})
			}

			res.locals.quizzes = quizzes
			res.render('quizzes')
		})
}

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

		if (quiz.length === 0){ return res.render('404') }

		res.locals.quiz = quiz
		// render template
		res.render('quiz')
	})
}

/**
 * show page for new quiz
 * @param  {string} quizId
 */
exports.showNewQuiz = function(req, res){
	
	res.render('newQuiz')
}

/**
 * show page for quiz editing
 * @param  {string} quizId
 */
exports.showQuizEdit = function(req, res, next){
	
	var quizId = req.params.quizId


	// get quiz object and render template
	
	Quiz
	.findById(quizId)
	.populate('questions')
	.lean()
	.exec(function(err, quiz){
		if (err){ return next(err) }

		casefiles.getUploadCreds(function(err, creds){
			if (err){ return next(err) }

			res.locals.uploadCreds = creds			
			res.locals.quiz = JSON.stringify(quiz)

			// render template
			res.render('editQuiz')
		})

	})
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

var _updateQuizObject = function(quiz, newQuiz, cb){
	quiz.title = newQuiz.title
	quiz.difficulty = newQuiz.difficulty
	quiz.type = newQuiz.type
	quiz.deleted = newQuiz.deleted

	// check if questions array populated with documents or just ids.
	// if ids, just update and save. If objects, we need to loop through
	// and individually save each question document.
	if (newQuiz.questions.length > 0 && _.isObject(newQuiz.questions[0])){

		var questions = []

		// save each question document and collect ids
		var saveQuestion = function(question, cb){
			_saveQuestion(question, function(err, question){
				if (err){ return cb(err) }
				questions.push(question._id)
				return cb()
			})
		}

		async.eachSeries(newQuiz.questions, saveQuestion, function(err){
			if (err){
				return cb(err)
			}

			quiz.questions = questions

			cb(null, quiz)
		})
	} else {
		quiz.questions = newQuiz.questions
		cb(null, quiz)
	}
}

var _updateQuestionObject = function(question, newQuestion){
	question.clinicalInfo = newQuestion.clinicalInfo
	question.stem = newQuestion.stem
	question.choices = newQuestion.choices
	question.category = newQuestion.category
	question.difficulty = newQuestion.difficulty
	question.diagnosis = newQuestion.diagnosis
	question.studyId = newQuestion.studyId

	return question
}


////////////////////
// Quiz functions //
////////////////////

exports.getQuiz = function(req,res){

	/**
	 * Get quiz by id
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

exports.getQuizzes = function(req, res){

	/**
	 * Get list of quizzes meeting criteria
	 */
	Quiz.find()
		.limit(50)
		.exec(function(err, quizzes){
			if (err){ return res.send(500, err) }
			if (!quizzes){ return res.send(404, 'No quizzes found') }

			return res.send(200, quizzes)
		})
}

exports.saveQuiz = function(req, res){

	/**
	 * Updating an existing case
	 */
	if (req.body._id){

		Quiz.findById(req.body._id).exec(function(err, quiz){
			if (err){return res.send(500, err)}

			_updateQuizObject(quiz, req.body, function(err, updatedQuiz){
				if (err){return res.send(500, err)}

				updatedQuiz.save(function(err){
					if (err){ return res.send(500, err) }
					res.send(200, updatedQuiz)
				})
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

			// send html if creating new quiz
			if (req.resFormat !== 'json'){
				return res.redirect('/quiz/edit/' + quiz._id)
			}

			res.send(201, quiz)
		})
	}
}

exports.removeQuiz = function(req, res){

	
	// Check if quiz has ever been taken. If so, just mark
	// as deleted and don't actually delete the record so users
	// who have taken it can still see their results.
	
	if (QuizResult.findOne({quiz: req.body._id})) {
		Quiz.update({ _id: req.body._id }, { $set: { deleted: true } }, function(err){
			if (err){ return res.send(500, err) }
			res.send(200, 'Quiz removed')
		})
	} else {
		Quiz.findById(req.body._id).remove(function(err){
			if (err){ return res.send(500, err) }
			res.send(200, 'Quiz removed')
		})
	}

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

function _saveQuestion (questionObj, cb){
	/**
	 * Updating an existing question
	 */
	if (questionObj._id){

		Question.findById(questionObj._id, function(err, question){

			question = _updateQuestionObject(question, questionObj)

			question.save(function(err){
				if (err){ return cb(err) }
				cb(null, question, 200)
			})
		})
	}

	/**
	 * Saving a new question
	 */
	else {
		var	question = new Question(questionObj);
	
		question.save(function(err){
			if(err){ cb(err) }
			cb(null, question, 201)
		})
	}
}

exports.saveQuestion = function(req, res){

	_saveQuestion(req.body, function(err, question, code){
		if (err){ return res.send(500, err) }
		res.send(code, question)
	})
}

exports.removeQuestion = function(req, res){

	// Check if question has ever been used in quiz. If so, just mark
	// as deleted and don't actually delete the record so users
	// who have taken it can still see their results.
	
	if (Quiz.findOne({questions: req.body._id})) {
		Question.update({ _id: req.body._id }, { $set: { deleted: true } }, function(err){
			if (err){ return res.send(500, err) }
			res.send(200, 'Question removed')
		})
	} else {
		Question.findById(req.body._id).remove(function(err){
			if (err){ return res.send(500, err) }
			res.send(200, 'Question removed')
		})
	}
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