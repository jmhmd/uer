var mongoose = require('mongoose'),
	simpleTimestamps = require( 'mongoose-simpletimestamps').SimpleTimestamps

var quizResultSchema = new mongoose.Schema({
	user: {type: mongoose.Schema.Types.ObjectId, required: true},
	quizName: String, // will record whatever the name of the quiz was when taken, even if changed later
	quizQuestions: [
		{
			questionId: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},

			// maps to optionId of chosen answer in Question model
			userAnswer: Number,

			// store here to make quick calculations of percent wrong/right
			// easier without needing to pull in whole question document
			correct: Boolean
		}
	],
	category: String,
	studyId: String // id of study stored in casefil.es
})

quizResultSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('QuizResult', quizResultSchema);