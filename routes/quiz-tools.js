"use strict";

var mongoose = require('mongoose'),
	Quiz = mongoose.model('Quiz'),
	QuizResult = mongoose.model('QuizResult'),
	_ = require('lodash')

exports.checkRestricted = function(req, res, next) {

	var quizId = req.params.quizId,
		accessCode = req.body.accessCode || req.params.accessCode || req.query.accessCode

	Quiz.findOne({_id: quizId}, function(err, quiz){
		if (err){ return next(err) }

		if (!quiz){
			return next( new Error('quiz not found'))
		}

		if (!accessCode && !quiz.restricted){
			return next()
		}

		var matchedAssignment = _.find(quiz.assignments, {accessCode: accessCode}),
			isValidAccessCode = matchedAssignment ? true : false

		if (!isValidAccessCode){
			req.flash('error', {msg: 'You must enter a valid access code'})
			return res.redirect('/quiz/'+quizId)
		}

		QuizResult.count({quiz: quizId, accessCode: accessCode}, function(err, count){
			if (err){ return next(err) }

			var remainingAttempts = matchedAssignment.attempts - count

			if (remainingAttempts > 0){
				return next()
			}

			
			req.flash('error', {msg: 'You have no remaining attempts'})

			return res.redirect('/quiz/'+quizId)
		})
	})
}