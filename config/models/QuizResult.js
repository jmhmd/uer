var mongoose = require('mongoose'),
	simpleTimestamps = require( 'mongoose-simpletimestamps').SimpleTimestamps

var quizResultSchema = new mongoose.Schema({
	user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
	quiz: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Quiz'},
	
	//TODO: record type of quiz, whether timed on non-timed

	// save reference to question used, as well as additional information
	// relating to user's answer
	quizQuestions: [
		{
			questionId: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},

			// maps to optionId of chosen answer in Question model
			userAnswer: {type: mongoose.Schema.Types.ObjectId},

			// store here to make quick calculations of percent wrong/right
			// easier without needing to pull in whole question document
			correct: Boolean,

			// collect chosen location of abnormality
			/*
			TODO: Make able to record multiple locations (array of arrays)
			TODO: Set parameter questionComplete on "mark as normal" or "next" with abnormality
			*/
			abnormalityLoc: {
				series: Number,
				image: Number,
				coords: [Number], // should be of length 2, with x,y coordinates
			},

			// time taken to answer question in ms
			questionTime: Number
		}
	],
	quizQuestionsCompleted: {type: Boolean, default: false},
	preQuestions: [
		{
			questionId: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
			userAnswer: {type: mongoose.Schema.Types.ObjectId},
			freeTextAnswer: String
		}
	],
	preQuestionsCompleted: {type: Boolean, default: false},
	postQuestions: [
		{
			questionId: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
			userAnswer: {type: mongoose.Schema.Types.ObjectId},
			freeTextAnswer: String
		}
	],
	postQuestionsCompleted: {type: Boolean, default: false},
	
	// results
	numberCorrect: Number,
	percentCorrect: Number,
	completed: {type: Boolean, default: false},

	// Timing
	totalQuizTime: Number,
	startDate: Date,
	endDate: Date,
	
	// Extras
	isGoldStandard: Boolean
})

quizResultSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('QuizResult', quizResultSchema);