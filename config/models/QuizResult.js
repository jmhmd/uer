var mongoose = require('mongoose'),
	simpleTimestamps = require( 'mongoose-simpletimestamps').SimpleTimestamps

var quizResultSchema = new mongoose.Schema({
	user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
	quiz: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Quiz'},

	timed: Boolean,
	
	// save reference to question used, as well as additional information
	// relating to user's answer
	quizQuestions: [
		{
			questionId: {type: mongoose.Schema.Types.ObjectId, ref: 'Image'},

			// 
			userAnswerNormal: Boolean,

			// should be integer 0 to 100, or Likert scale?
			confidenceLevel: Number,

			// store here to make quick calculations of percent wrong/right
			// easier without needing to pull in whole question document
			correct: Boolean,

			// collect chosen location of abnormality
			/*
			TODO: Set parameter questionComplete on "mark as normal" or "next" with abnormality
			*/
			abnormalityLoc: [
				{
					series: Number,
					image: Number,
					coords: [Number], // should be of length 2, with x,y coordinates
					time: Number
				}
			],

			questionComplete: {type: Boolean, default: false},

			// time taken to answer question in ms
			questionTime: Number
		}
	],
	quizQuestionsCompleted: {type: Boolean, default: false},
	
	// results
	numberCorrect: Number,
	percentCorrect: Number,
	completed: {type: Boolean, default: false},

	// Timing
	totalQuizTime: Number,
	startDate: Date,
	endDate: Date,
	
	// Extras
	// isGoldStandard: Boolean
})

quizResultSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('QuizResult', quizResultSchema);