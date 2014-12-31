'use strict';

var util = require('util'),
	_ = require('lodash'),
	mongoose = require('mongoose'),
	Quiz = mongoose.model('Quiz'),
	QuizResult = mongoose.model('QuizResult'),
	Image = mongoose.model('Image'),
	QuestionRoute = require('./question.js'),
	validator = require('validator'),
	request = require('request'),
	secrets = require('../config/secrets'),
	casefiles = secrets.casefiles,
	async = require('async'),
	math = require('mathjs')(),
	info = require('debug')('info')

exports.isQuizOwner = function(req, res, next) {
	var quizId = req.params.quizId,
		userId = req.user._id

	if (req.user.isSuperAdmin){ return next() }

	Quiz.findById(quizId, function(err, quiz){
		if (err){ return next(err) }

		if (!quiz.creator || quiz.creator.equals(userId)){
			return next()
		} else {
			req.flash('error', {msg: 'Quiz is not owned by current user'})
			res.redirect('/quizzes')
		}
	})
}

/**
 * show page to list quizzes
 */
exports.showQuizList = function(req, res, next){

	/**
	 * Get list of quizzes meeting criteria
	 */
	var query = {deleted: {'$ne': true}}
	
	if (!req.user.isAdmin){
		query.enabled = true
	}
	
	Quiz.find(query)
		.limit(50)
		.exec(function(err, quizzes){
			if (err){ return next(err) }

			if (quizzes.length === 0){
				req.flash('info', {msg: 'No quizzes found.'})
			}

			res.locals.quizzes = quizzes

			Image.count({normal: true}, function(err, result){
				if (err){ return next(err) }

				res.locals.numNormal = result

				Image.count({normal: false}, function(err, result){
					if (err){ return next(err) }

					res.locals.numAbnormal = result
					res.locals.totalImages = res.locals.numNormal + res.locals.numAbnormal

					res.render('quizzes')

				})
			})
		})
}

/**
 * show quiz taking history
 */
exports.showQuizHistory = function(req, res, next){

	var userId = req.user._id

	if (!userId){ return next('Not logged in!') }

	/**
	 * Get all quizzes taken by current user
	 */
	QuizResult.find({user: userId})
		.populate('quiz')
		.sort('-updatedAt')
		.lean()
		.exec(function(err, quizzes){
			if (err){ return next(err) }

			if (quizzes.length === 0){
				req.flash('error', {msg: 'No quizzes found.'})
			}

			res.locals.quizzes = quizzes
			res.render('quiz-history')
		})
}

var _getLeanQuizObject = function(id, cb){

	Quiz
	.findById(id)
	.lean()
	.exec(function(err, quiz){
			if (err){ return cb(err) }
			return cb(null, quiz)
		})
}

/**
 * show page for quiz overview (start)
 * @param  {string} quizId
 */
exports.showQuiz = function(req, res, next){
	
	var quizId = req.params.quizId,
		userId = req.user._id

	Quiz
	.findById(quizId)
	.lean()
	.exec(function(err, quiz){
		if (err){ return next(err) }

		// get quiz history
		QuizResult.find({user: userId, quiz: quizId}).sort('-updatedAt').lean().exec(function(err, quizHistory){
			if (err){ return next(err) }

			res.locals.quizHistory = quizHistory
			res.locals.quiz = quiz
			res.locals.quiz.JSON = JSON.stringify(quiz)
			// render template
			res.render('quiz-landing')
		})

	})
}

/**
 * load quiz angular-js app to take quiz (start)
 * @param  {string} quizId
 */

exports.startTimedQuiz = function(req, res, next){

	req.params.timed = true

	exports.startQuiz(req, res, next)
}

exports.startQuiz = function(req, res, next){
	
	var quizId = req.params.quizId

	_getLeanQuizObject(quizId, function(err, quiz){
		if (err){ return next(err) }

		if (!quiz){ return res.send(404, 'Quiz not found') }

		/**
		 * Check if user has an incomplete instance of this quiz, if so, load it up. 
		 * If not, create a new quiz instance and load it up.
		 */
		QuizResult.findOne({user: req.user._id, quiz: quiz._id, completed: false}).populate('quizQuestions.questionId').exec(function(err, quizResult){
			if (err){ return next(err) }

			if (!quizResult){

				console.log('generate new quiz')

				quizResult = new QuizResult()


				quizResult.user = req.user._id
				quizResult.quiz = quiz._id
				quizResult.startDate = new Date()
				quizResult.totalQuizTime = 0
				quizResult.timed = req.params.timed ? true : false

				// get number of available questions
				var numNormal,
					numAbnormal

				// get normal count
				Image.count({normal: true}, function(err, result){
					if (err){ return next(err) }

					numNormal = result
					
					// get abnormal count
					Image.count({normal: false}, function(err, result){
						if (err){ return next(err) }

						numAbnormal = result

						// how many of each type requested by quiz?
						var requestedNormals = _.find(quiz.questionTypes, {questionType: 'normal'}).number
						var requestedAbnormals = _.find(quiz.questionTypes, {questionType: 'abnormal'}).number
						console.log('requested:', requestedNormals, numNormal, requestedAbnormals, numAbnormal)

						var getRandomIndices = function (num, max){
							if (num > max + 1){
								num = max + 1
							}

							var indices = []
							var getIndex = function (max){
								var index = _.random(max)
								if (indices.indexOf(index) > -1){
									return getIndex(max)
								} else {
									return index
								}
							}
							for (var i = 0; i < num; i++) {
								indices.push(getIndex(max))
							}
							return indices
						}

						// randomly select indexes
						var normalIndices = getRandomIndices(requestedNormals, numNormal - 1)
						var abnormalIndices = getRandomIndices(requestedAbnormals, numAbnormal - 1)
						console.log('indices:', normalIndices, abnormalIndices)

						/* 
						get image ids 
						*/

						// get normals
						Image.find({normal: true}).select('_id').lean().exec(function(err, images){
							if (err){ return next(err) }

							var normalImages = _.remove(images, function(image, i){ return normalIndices.indexOf(i) > -1 })

							// get abnormals
							Image.find({normal: false}).select('_id').lean().exec(function(err, images){
								if (err){ return next(err) }

								var abnormalImages = _.remove(images, function(image, i){ return normalIndices.indexOf(i) > -1 })

								// concatenate normal and abnormals, shuffle
								var questionIds = _.shuffle(normalImages.concat(abnormalImages))

								console.log('questionIds:', questionIds)

								// fill in question ids
								_.each(questionIds, function(qId){
									quizResult.quizQuestions.push({
										questionId: qId
									})
								})

								console.log(quizResult)

								quizResult.save(function(err){
									if (err){ return next(err) }
									
									exports.startQuiz(req, res, next)
									//send(quiz, quizResult)
								})
							})
						})
					})
				})

			} else {
				console.log('continue quiz')
				send(quiz, quizResult)
			}
		})


	})

	var send = function(quiz, quizResult){
		res.locals.quiz = quiz
		res.locals.quiz.JSON = JSON.stringify(quiz)
		res.locals.quizResult = {
			JSON: JSON.stringify(quizResult)
		}

		// render template
		
		if (!quizResult.quizQuestionsCompleted){
			console.log('render quiz')
			res.render('quiz')
		} else {
			console.log('render results')
			// complete quiz, go to results page
			quizResult.completed = true
			quizResult.save(function(err){
				if (err){ return next(err) }

				res.redirect('/quiz/result/' + quizResult._id)
			})
		}
	}
}

/**
 * show quiz result page
 */
exports.quizResult = function(req, res, next){

	var quizResultId = req.params.quizResultId

	QuizResult
	.find({_id: quizResultId})
	.select('-quizQuestions.abnormalityLoc._id')
	.populate('quizQuestions.questionId')
	.populate('preQuestions.questionId')
	.populate('postQuestions.questionId')
	.populate('quiz')
	.exec(function(err, quizResult){
		if (err){ return next(err) }

		if (quizResult.length !== 1){
			return next('Duplicate quiz id or quiz result not found')
		}

		quizResult = quizResult[0]

		console.log(quizResult)

		if (!quizResult){
		// no quiz found matching given id
		
			console.log('requested quiz not found')
			return res.render('404')
		}
		else if (!quizResult.completed){
		// quiz not finished yet

			console.log('quiz not completed')

			// req.flash('error', 'The selected quiz has not been completed. <a href="/quiz/go/'+quizResultId+'">Click here to resume the quiz</a>')
			//req.flash('error', 'The selected quiz has not been completed.')
			//return res.render('quiz-result')
		}
		else if (_.isUndefined(quizResult.percentCorrect)){
		// computing results for the first time
		
			// mark end time
			quizResult.endDate = new Date()

			console.log('compute result')

			var numberCorrect = 0,
				totalQuizTime = 0

			// check each answer and add up total time
			_.each(quizResult.quizQuestions, function(question){

				if (quizResult.timed){
					if (_.isUndefined(question.userAnswerNormal)){
						question.userAnswerNormal = true
					}
				}

				// see if it matches the user's answer or not
				question.correct = question.userAnswerNormal === question.questionId.normal

				// log correct answer
				if (question.correct){ numberCorrect += 1 }

				// log time taken for question
				if (question.questionTime > 0){ totalQuizTime += question.questionTime }
			})

			quizResult.numberCorrect = numberCorrect
			quizResult.percentCorrect = (numberCorrect / quizResult.quizQuestions.length * 100).toFixed(1)
			quizResult.totalQuizTime = totalQuizTime
			
			quizResult.save(function(err){
				if (err){ return next(err) }

				res.locals.quizResult = quizResult
				sendResult()
			})
		}
		else {
		// results/performance already computed, just generate the page
			
			res.locals.quizResult = quizResult
			sendResult()
		}
	})

	var sendResult = function(){

		console.log('send result')

		_.forEach(res.locals.quizResult.quizQuestions, function(question){
			question.abnormalityLocJSON = JSON.stringify(question.abnormalityLoc)
		})

		_getGoldStandard(res.locals.quizResult.quiz._id, function(err, goldStandard){
			if (err){ return next(err) }

			if (goldStandard){
				res.locals.goldStandard = goldStandard

				_.each(res.locals.quizResult.quizQuestions, function(question){
					question.goldStandardLoc = _.find(goldStandard.quizQuestions, {questionId: question.questionId._id}).abnormalityLoc
				})
			}

			console.log('render result')

			res.render('quiz-result')
		})
	}
}

var _getGoldStandard = function(quizId, cb){

	QuizResult.findOne({quiz: quizId, isGoldStandard: true}).exec(function(err, quizResult){
		if (err){ return cb(err) }
		if (!quizResult || quizResult.length === 0){ return cb(null, null) }

		return cb(null, quizResult)
	})
}

exports.showQuizReport = function(req, res, next){

	var quizId = req.params.quizId

	QuizResult
		.find({quiz: quizId, completed: true})
		.select('-quizQuestions.abnormalityLoc._id')
		.populate('quizQuestions.questionId')
		.sort('endDate')
		.exec(function(err, results){
			if (err){ return next(err) }
			if (!results || results.length === 0){
				req.flash('error', {msg: 'No finished quizzes found with this id'})
				return res.render('404')
			}

			/*
			Breakdown per user
			 */
			var usersTaken = []

			_.each(results, function(result){

				var user = _.find(usersTaken, {userId: result.user})

				if (user){
					user.scores.push(result.percentCorrect)
					user.average = math.round(math.mean(user.scores))
				} else {
					user = {
						userId: result.user,
						scores: [result.percentCorrect],
						average: result.percentCorrect
					}
					usersTaken.push(user)
				}
			})

			res.locals.usersTaken = usersTaken
			res.locals.numUsersTaken = usersTaken.length
			res.locals.maxAttempts = _.max(_.map(usersTaken, function(user){return user.scores.length}))
			res.locals.averageScore = math.round(math.mean(_.pluck(results, 'percentCorrect')), 1)
			

			/*
			Breakdown per question
			 */
			
			var questions = []

			_.each(results, function(result){

				_.each(result.quizQuestions, function(userQuestion){

					var question = _.find(questions, {id: userQuestion.questionId._id})

					if (question){
						question.total = question.total + 1
						if (userQuestion.correct){ question.correct = question.correct + 1 }
						if (userQuestion.abnormalityLoc){
							question.locations.push(userQuestion.abnormalityLoc.coords)
						}
					} else {
						question = {
							id: userQuestion.questionId._id,
							questionId: userQuestion.questionId,
							stem: userQuestion.questionId.stem,
							studyId: userQuestion.questionId.studyId,
							total: 1,
							correct: userQuestion.correct ? 1 : 0,
							locations: userQuestion.abnormalityLoc
						}
						questions.push(question)
					}
				})
			})

			_.each(questions, function(question){
				question.percentCorrect = math.round((question.correct / question.total) * 100)
				question.locationsJSON = JSON.stringify(question.locations)
			})

			res.locals.questions = questions

			Quiz
				.findById(quizId)
				.lean()
				.exec(function(err, quiz){
					if (err){ return next(err) }
					if (!quiz){
						req.flash('error', {msg: 'No quiz found with this id'})
						return res.render('404')
					}

					res.locals.quiz = quiz

					res.render('quiz-report')
				})
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
	
	var quizId = req.params.quizId,
		prepost = req.params.prepost


	// get quiz object and render template
	_getLeanQuizObject(quizId, function(err, quiz){
		if (err){ return next(err) }

		casefiles.getUploadCreds(function(err, creds){
			if (err){ return next(err) }

			res.locals.uploadCreds = creds			
			res.locals.JSONquiz = JSON.stringify(quiz)
			res.locals.quiz = quiz
			res.locals.uploadKeyRoot = secrets.uploadKeyRoot

			if (prepost){
				if (prepost === 'pre'){
					res.render('editPreQuiz')
				} else if (prepost === 'post'){
					res.render('editPostQuiz')
				}
			} else {
				// render template
				res.render('editQuiz')
			}
		})
	})
}

// /**
//  * Show aggregated quiz results, comparisons, etc
//  * @param  {string}   quizId
//  */
// exports.showResults = function(req, res, next){

// 	var quizResultId = req.params.quizResultId
	
// 	// get question object and render template
// 	QuizResult
// 	.findById(quizResultId)
// 	.exec(function(err, quizResult){
// 		if (err){ return next(err) }

// 		/**
// 		 * @todo Pull in all other answers to each question to calculate
// 		 *       percent right/wrong, and calculate overall quiz performance
// 		 *       for all users
// 		 */

// 		// render template
// 		res.render('quizResults', quizResult)
// 	})
// }

///////////////////////
// Private functions //
///////////////////////

var _updateQuizObject = function(quiz, newQuiz, cb){
	quiz.title = newQuiz.title || quiz.title
	quiz.type = newQuiz.type || quiz.type
	quiz.deleted = newQuiz.deleted || quiz.deleted
	quiz.enabled = newQuiz.enabled || quiz.enabled
	quiz.attempts = newQuiz.attempts || quiz.attempts
	quiz.questionTypes = newQuiz.questionTypes || quiz.questionTypes
	cb(null, quiz)	
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
		/*.populate({
			path: 'questions',
			match: { deleted: {$ne: true}}
		})
		.populate({
			path: 'preQuestions',
			match: { deleted: {$ne: true}}
		})
		.populate({
			path: 'postQuestions',
			match: { deleted: {$ne: true}}
		})*/
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

				console.log('quiz:', updatedQuiz)
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
		var	quiz = new Quiz()

		quiz.creator = req.user._id
		quiz.title = req.body.title
		quiz.questionTypes = [
			{
				questionType: 'normal',
				number: req.body.normals
			},
			{
				questionType: 'abnormal',
				number: req.body.abnormals
			}
		]

		quiz.save(function(err){
			if(err){ return res.send(500, err) }

			// send html if creating new quiz
			if (req.resFormat !== 'json'){
				return res.redirect('/quizzes/')
			} else {
				return res.send(201, quiz)
			}
		})
	}
}

var _deleteQuiz = function(quizId, user, cb){
	
	cb = _.isFunction(cb) ? cb : _.noop
	
	// Check if quiz has ever been taken. If so, just mark
	// as deleted and don't actually delete the record so users
	// who have taken it can still see their results.
	
	QuizResult.findOne({quiz: quizId}, function(err, result){
		if (err){ console.log(err) }
		
		if (result){
		// quiz has been taken, mark as deleted
		
			Quiz.update({ _id: quizId }, { $set: { deleted: true } }, function(err){
				if (err){ return cb(err) }

				console.log('Quiz set as deleted: ', quizId)
				cb(null, 'Quiz set as deleted')
			})
		} else {
		// quiz has never been taken, can just remove permanently
			
			// retrieve quiz
			Quiz.findById(quizId).exec(function(err, quiz){
				if (err){ return cb(err) }
				if (!quiz){ return cb('Quiz '+quizId+' not found')}
				
				var removeQuestion = function(questionId, cb1){

					QuestionRoute._removeQuestion(questionId, user, function(err){
						if (err){ return cb1(err) }
						return cb1()
					})
				}

				// delete all questions and images associated with quiz
				async.each(quiz.questions, removeQuestion, function(err){
					if (err){ return cb(err) }

					console.log('All quiz questions deleted')
					
					// delete quiz
					quiz.remove(function(err){
						if (err){ return cb(err) }

						console.log('Quiz deleted: ', quizId)
						cb(null, 'Quiz removed')
					})	
				})

			})
		}
	})
}

exports.removeQuiz = function(req, res, next){

	var quizId = req.params.quizId

	_deleteQuiz(quizId, req.user, function(err, msg){
		if (err){ return next(err) }

		req.flash('info', {msg: msg})
		res.redirect('/quizzes')
	})
}

exports.setAvailability = function(req, res){

	var quizId = req.params.quizId,
		quizState = req.body.enabled
	
	//return res.send(500, 'test error')
	
	if (!quizId || !quizState){
		return res.send(500, 'Must specify quiz and availability')
	}

	Quiz.update({ _id: quizId }, { $set: { enabled: quizState } }, function(err){
		if (err){ return res.send(500, err) }

		info('Quiz availability updated: ', quizId, quizState)
		res.send(200, 'Quiz availability updated')
	})
}

exports.setRestricted = function(req, res){

	var quizId = req.params.quizId,
		quizState = req.body.restricted
	
	//return res.send(500, 'test error')
	
	if (!quizId || !quizState){
		return res.send(500, 'Must specify quiz and attribute state')
	}

	Quiz.update({ _id: quizId }, { $set: { restricted: quizState } }, function(err){
		if (err){ return res.send(500, err) }
		
		info('Quiz restriction updated:', quizId, quizState)
		res.send(200, 'Quiz restriction updated')
	})
}

exports.setRandomize = function(req, res){

	var quizId = req.params.quizId,
		quizRandomize = req.body.randomize
	
	//return res.send(500, 'test error')
	
	if (!quizId || !quizRandomize){
		return res.send(500, 'Must specify quiz and attribute state')
	}

	Quiz.update({ _id: quizId }, { $set: { randomize: quizRandomize } }, function(err){
		if (err){ return res.send(500, err) }

		info('Quiz randomization updated: ', quizId, quizRandomize)
		res.send(200, 'Quiz randomization updated')
	})
}

exports.addAssignment = function(req, res, next){

	var quizId = req.params.quizId,
		label = req.body.label,
		attempts = req.body.attempts
	
	//return res.send(500, 'test error')
	
	if (!quizId){
		return res.send(500, 'Must specify quiz')
	}

	Quiz.findOne({ _id: quizId }, function(err, quiz){
		if (err){ return next(err) }
		if (!quiz){ 
			req.flash('error', {msg: 'No finished quizzes found with this id'})
			return res.render('404')
		}
		
		if (!quiz.assignments){
			quiz.assignments = []
		}
		
		quiz.assignments.push({
			label: label,
			attempts: attempts,
			accessCode: ("000000" + (Math.random()*Math.pow(36,6) << 0).toString(36)).slice(-6)
		})
		
		quiz.save(function(err){
			if (err){ return next(err) }
			
			return res.redirect('/quizzes')
		})
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

	req.checkBody('studyObj.diagnosis', 'Must include diagnosis').notEmpty()
	req.checkBody('studyObj.category', 'Must include category').notEmpty()

	errors = req.validationErrors()

	if (req.body.studyObj.imageStacks && req.body.studyObj.imageStacks.length > 0){
		_.each(req.body.studyObj.imageStacks, function(stack){
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
	 * Delete case from casefiles
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