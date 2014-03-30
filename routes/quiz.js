'use strict';

var util = require('util'),
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Quiz = mongoose.model('Quiz'),
	Question = mongoose.model('Question'),
	QuizResult = mongoose.model('QuizResult'),
	validator = require('validator'),
	request = require('request'),
	secrets = require('../config/secrets'),
	casefiles = secrets.casefiles,
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

var _getLeanQuizObject = function(id, cb){

	Quiz
	.findById(id)
	.populate({
			path: 'questions',
			match: { deleted: false }
		})
	.lean()
	.exec(function(err, quiz){
		if (err){ return cb(err) }

/*
		// get image objects for each question in the quiz from casefiles
		if(quiz.questions.length > 0){

			var setCaseImage = function(question, cb){

				if (question.studyId){

					_getImageObject(question.studyId, function(err, imageObject){
						if (err){ return cb(err) }
						console.log(imageObject)
						question.studyId = imageObject
						cb()
					})
				} else {
					cb()
				}
			}

			async.eachSeries(quiz.questions, setCaseImage, function(err){
				if (err){ return cb(err) }
				return cb(null, quiz)
			})
		} else {

			return cb(null, quiz)
		}
*/		
		return cb(null, quiz)
	})
}

/**
 * show page for quiz overview (start)
 * @param  {string} quizId
 */
exports.showQuiz = function(req, res, next){
	
	var quizId = req.params.quizId

	_getLeanQuizObject(quizId, function(err, quiz){
		if (err){ return next(err) }

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
	_getLeanQuizObject(quizId, function(err, quiz){
		if (err){ return next(err) }

		casefiles.getUploadCreds(function(err, creds){
			if (err){ return next(err) }

			res.locals.uploadCreds = creds			
			res.locals.quiz = JSON.stringify(quiz)
			res.locals.uploadKeyRoot = secrets.uploadKeyRoot

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
		// questions parameter is a simple array of objectIds
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
		.populate({
			path: 'questions',
			match: { deleted: false }
		})
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
	 * Updating an existing quiz
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
	 * Saving a new quiz
	 */
	else {

		// create new mongoose quiz object
		var	quiz = new Quiz();

		// use this function instead of the Quiz constructor directly
		// so we get the object modifications before saving
		_updateQuizObject(quiz, res.body, function(err, updatedQuiz){
			if (err){ return res.send(500, err) }

			updatedQuiz.save(function(err){
				if(err){ return res.send(500, err) }

				// send html if creating new quiz
				if (req.resFormat !== 'json'){
					return res.redirect('/quiz/edit/' + quiz._id)
				} else {
					return res.send(201, quiz)
				}

			})
		})
	
	}
}

exports.removeQuiz = function(req, res){

	
	// Check if quiz has ever been taken. If so, just mark
	// as deleted and don't actually delete the record so users
	// who have taken it can still see their results.
	
	QuizResult.findOne({quiz: req.body._id}, function(err, result){
		if (err){ console.log(err) }

		console.log(result)
		
		if (result && result.length > 0){
			Quiz.update({ _id: req.body._id }, { $set: { deleted: true } }, function(err){
				if (err){ return res.send(500, err) }
				res.send(200, 'Quiz set as deleted')
			})
		} else {
			Quiz.findById(req.body._id).remove(function(err){
				if (err){ return res.send(500, err) }
				res.send(200, 'Quiz removed')
			})
		}
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
		.populate({
			path: 'questions',
			match: { deleted: false }
		})
		.exec(function(err, question) {
			if (err) {
				return res.send(500, err)
			}
			if (!question) {
				return res.send(404, 'Question not found')
			}

			return res.send(200, question)
		})
}

function _saveQuestion (questionObj, cb){
	/**
	 * Updating an existing question
	 */
	if (questionObj._id){

		Question.findById(questionObj._id, function(err, question){
			if (err){ return cb(err) }

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
	
	QuizResult.findOne({'quizQuestions': { $elemMatch: {'questionId': req.body._id}}}, function(err, result){
		if (err){ console.log(err) }

		console.log('Has this question been used in a quiz? ', result)
		
		if (result && result.length > 0){
			Question.update({ _id: req.body._id }, { $set: { deleted: true } }, function(err){
				if (err){ return res.send(500, err) }
				res.send(200, 'Question set as deleted')
			})
		} else {

			// remove study from casefiles
			request.post({
					url: casefiles.url + 'api/client/removeStudy',
					json: {
						email: req.user.email,
						apikey: casefiles.apikey,
						studyId: req.body.studyId
					}
				},
				function(err, response, body) {
					if (!err && response.statusCode !== 200 && response.statusCode !== 201){
						err = body
					}
					if (err) {
						return res.send(500, err)
					}

					console.log(body)

					Question.findById(req.body._id).remove(function(err){
						if (err){ return res.send(500, err) }
						res.send(200, 'Question removed')
					})
				})
		}
	})
	
	/*if (QuizResult.findOne({'quizQuestions': { $elemMatch: {'questionId': req.body._id}}})) {
		
	} else {
		
	}*/
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

	req.checkBody('studyObj.diagnosis', 'Must include diagnosis').notEmpty()
	req.checkBody('studyObj.category', 'Must include category').notEmpty()

	errors = req.validationErrors()

	if (req.body.studyObj.imageStacks && req.body.studyObj.imageStacks.length > 0){
		_.each(req.body.studyObj.imageStacks, function(stack, i){
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
	 * Prepare study object
	 */
	var studyObj = req.body.studyObj

	if (req.body.studyId){
		studyObj._id = req.body.studyId
	}

	/**
	 * Send case to casefiles
	 */
	
	console.log(studyObj)

	request.post({
			url: casefiles.url + 'api/client/saveStudy',
			json: {
				email: req.user.email,
				apikey: casefiles.apikey,
				study: studyObj
			}
		},
		function(err, response, body) {
			if (!err && response.statusCode !== 200 && response.statusCode !== 201){
				err = body
			}
			if (err) {
				return res.send(500, err)
			}

			res.send(200, body)
		})
}

/**
 * Load study object from casefiles API
 * @param  {String} id Unique id for study in casefiles
 * @return {String}    JSON object of study
 */
var _getImageObject = function(id, cb){

	request.get({
			url: casefiles.url + 'api/study/load/' + id + '?apikey=' + casefiles.apikey
		}, function(err, response, body){
			if (err) { return cb(err) }
			if (response.statusCode !== 200){ return cb(body) }
			cb(null, body)
		})
}

exports.getImageObject = function(req, res){
	var id = req.params.id

	_getImageObject(id, function(err, imageObject){
		if (err) { return res.send(500, err) }
		res.send(200, imageObject)
	})
}

/**
 * Delete study from casefiles, including images and metadata
 * Required:
 * res.body._id // id of study being removed
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
			if (!err && response.statusCode !== 200){
				err = body
			}
			if (err) {
				return res.send(500, err)
			}
			res.send(200, body)
		})
}

/**
 * Delete images from study object, but don't delete container and metadata
 * @param  {string} req.body.studyId - Id of study saved in casefiles to empty
 */
exports.clearImages = function(req, res){

	if (!req.body.studyId){
		res.send(400, 'Must include study id to clear')
		return
	}

	request.post({
			url: casefiles.url + 'api/client/deleteAll/' + req.body.studyId + '/' + 0,
			json: {
				apikey: casefiles.apikey
			}
		},
		function(err, response, body) {
			if (!err && response.statusCode !== 200){
				err = body
			}
			if (err) {
				return res.send(500, err)
			}
			res.send(200, body)
		})
}