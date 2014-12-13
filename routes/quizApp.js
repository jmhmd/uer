'use strict';

var util = require('util'),
	_ = require('lodash'),
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
 * update quizResult object with new values
 */

var _updateQuizProgress = function(oldObj, newObj, cb){

	var newQuestions = newObj.quizQuestions,
		newPreQuestions = newObj.preQuestions,
		newPostQuestions = newObj.postQuestions

	oldObj.preQuestionsCompleted = newObj.preQuestionsCompleted
	oldObj.quizQuestionsCompleted = newObj.quizQuestionsCompleted
	oldObj.postQuestionsCompleted = newObj.postQuestionsCompleted
	
	oldObj.completed = (newObj.completed === 'false' || newObj.completed === '0') ? false : newObj.completed

	_.each(oldObj.quizQuestions, function(question, i){

		var nq = newQuestions[i]
		
		question.userAnswer = nq.userAnswer
		question.abnormalityLoc = nq.abnormalityLoc
		question.questionTime = nq.questionTime
	})


	if (newPreQuestions && newPreQuestions.length > 0){
		_.each(oldObj.preQuestions, function(question, i){

			var nq = newPreQuestions[i]
			
			question.userAnswer = nq.userAnswer
			question.freeTextAnswer = nq.freeTextAnswer
		})
	}
	if (newPostQuestions && newPostQuestions.length > 0){
		_.each(oldObj.postQuestions, function(question, i){

			var nq = newPostQuestions[i]
			
			question.userAnswer = nq.userAnswer
			question.freeTextAnswer = nq.freeTextAnswer
		})
	}

	cb(null, oldObj)
}

/**
 * save user progress in quiz
 */
exports.saveQuizProgress = function(req, res, next){

	if (!req.body._id){

		return res.send(500, 'no quiz result ID supplied')
	} else {

		QuizResult.findById(req.body._id).exec(function(err, quizResult){
			if (err){ return res.send(500, err) }

			_updateQuizProgress(quizResult, req.body, function(err, updatedQuizResult){
				if (err){ return res.send(500, err) }

				updatedQuizResult.save(function(err){
					if (err){ return res.send(500, err) }

					res.send(200, 'quiz progress saved')
				})
			})
		})
	}
}