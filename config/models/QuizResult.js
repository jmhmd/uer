var mongoose = require('mongoose'),
	simpleTimestamps = require( 'mongoose-simpletimestamps').SimpleTimestamps

var quizResultSchema = new mongoose.Schema({
	user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
	quiz: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Quiz'},

	// save reference to question used, as well as additional information
	// relating to user's answer
	quizQuestions: [
		{
			questionId: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},

			// maps to optionId of chosen answer in Question model
			userAnswer: Number,

			// store here to make quick calculations of percent wrong/right
			// easier without needing to pull in whole question document
			correct: Boolean,

			// collect chosen location of abnormality
			abnormalityLoc: {
				series: Number,
				image: Number,
				coords: [Number], // should be of length 2, with x,y coordinates
			}
		}
	],
	percentCorrect: Number
})

quizResultSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('QuizResult', quizResultSchema);