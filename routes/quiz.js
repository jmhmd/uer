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

}

exports.saveQuestion = function(req, res){

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
	
	console.log(req.body)
	
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