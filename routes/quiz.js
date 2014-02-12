'use strict';

var util = require('util'),
	mongoose = require('mongoose'),
	Quiz = require('../config/models/Quiz'),
	Question = require('../config/models/Question'),
	QuizResult = require('../config/models/QuizResult'),
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

exports.saveQuiz = function(req, res){

	/**
	 * Validate case before trying to save
	 */
	
	var errors, loopErrors = false

	req.checkBody('diagnosis', 'Must include diagnosis').notEmpty()
	req.checkBody('category', 'Must include category').notEmpty()

	errors = req.validationErrors()

	if (req.body.imageStacks.length > 0){
		_.each(req.body.imageStacks, function(stack){
			if (!validator.isLength(stack.modality, 1)){
				if (!loopErrors){ loopErrors = [] }
				loopErrors.push({param: 'modality', msg: 'modality required', value: stack.modality })
			}
		})
	}
	
	if (errors || loopErrors) {
		var message = 'There have been validation errors: ' + util.inspect(errors) + util.inspect(loopErrors)
		res.send(400, message)
		return
	}

	/**
	 * Send case to casefiles
	 */
	
	request.post({
		url: casefiles.url + 'api/user/addToAffiliation', 
		json: {
			email: user.email,
			apikey: casefiles.apikey
		}},
		function(err, response, body){
			if (err){ return next(err) }

			// user successfully created, make admin
			setAsAdmin(user)
		})

	res.send(200, 'Quiz saved')
}