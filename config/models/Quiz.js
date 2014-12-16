var mongoose = require('mongoose'),
	simpleTimestamps = require('mongoose-simpletimestamps').SimpleTimestamps

var quizSchema = new mongoose.Schema({
	creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	title: {type: String, required: 'A title is required'},
	type: {
		type: String, 
		enum: [
			'module',
			'random'
		],
		default: 'module'
	},

	// questions: [{type: mongoose.Schema.Types.ObjectId, ref: 'Question'}],
	/*
	Allow choosing of the type(s) of questions to include in the quiz, and the number. This
	will allow the system to choose from a pool dynamically.
	 */
	questionTypes: [
		{
			questionType: String,
			number: Number
		}
	],
	enabled: {type: Boolean, default: false},
	randomize: {type: Boolean, default: false},
	attempts: {type: Number, default: -1}, // a value of -1 denotes infinite attempts
	deleted: {type: Boolean, default: false}
})

quizSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('Quiz', quizSchema);