////////////////////////
// Question functions //
////////////////////////

var mongoose = require('mongoose'),
	Question = mongoose.model('Question'),
	QuizResult = mongoose.model('QuizResult'),
	request = require('request'),
	secrets = require('../config/secrets'),
	casefiles = secrets.casefiles

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
exports._saveQuestion = _saveQuestion

exports.saveQuestion = function(req, res){

	_saveQuestion(req.body, function(err, question, code){
		if (err){ return res.send(500, err) }
		res.send(code, question)
	})
}

function _removeQuestion (questionId, user, cb){

	cb = _.isFunction(cb) ? cb : _.noop

	// Check if question has ever been used in quiz. If so, just mark
	// as deleted and don't actually delete the record so users
	// who have taken it can still see their results.
	
	QuizResult.findOne({'quizQuestions': { $elemMatch: {'questionId': questionId}}}, function(err, result){
		if (err){ console.log(err) }

		console.log('Has this question been used in a quiz? ', result)
		
		if (result){
			Question.update({ _id: questionId }, { $set: { deleted: true } }, function(err){
				if (err){ return cb(err) }

				console.log('Question set as deleted')
				cb(null, 'Question set as deleted')
			})
		} else {

			// remove study from casefiles
			
			Question.findById(questionId).exec(function(err, question){
				if (err){ return cb(err) }
				if (!question){ return cb('question not found') }

				request.post({
						url: casefiles.url + 'api/client/removeStudy',
						json: {
							email: user.email,
							apikey: casefiles.apikey,
							studyId: question.studyId
						}
					},
					function(err, response, body) {
						if (!err && response.statusCode !== 200){
							err = body
						}
						if (err) { return cb(err) }

						console.log('Study deleted from casefiles: ', body)

						question.remove(function(err){
							if (err){ return cb(err) }

							console.log('Question removed')
							cb(null, 'Question removed')
						})
					})
			})
		}
	})
	
	/*if (QuizResult.findOne({'quizQuestions': { $elemMatch: {'questionId': req.body._id}}})) {
		
	} else {
		
	}*/
}

exports.removeQuestion = function(req, res){

	_removeQuestion(req.body._id, req.user, function(err, msg){
		if (err){ return res.send(500, err) }
		res.send(200, msg)
	})
}