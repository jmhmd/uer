var mongoose = require('mongoose'),
	simpleTimestamps = require('mongoose-simpletimestamps').SimpleTimestamps

var questionSchema = new mongoose.Schema({
	clinicalInfo: String,
	stem: {type: String, required: 'A question stem is required'},
	//answerType: {type: String, enum: ['multipleChoice', 'freeText'], default: 'multipleChoice'},
	choices: [
		{
			option: String,
			explanation: String,
			correct: {type: Boolean, default: false}
		}
	],
	//textAnswer: String, // only available for questions of type 'pre' or 'post' at this point
	answerRequired: {type: Boolean, default: false},
	diagnosis: String,
	category: String,
	difficulty: Number,
	studyId: String, // id of study stored in casefil.es
	deleted: {type: Boolean, default: false},
	type: {
		type: String, 
		enum: [
			'pre',
			'post',
			'quiz'
		],
		default: 'quiz'
	},
	format: {
		type: String, 
		enum: [
			'multipleChoice',
			'freeText'
		],
		default: 'multipleChoice'
	}
})

questionSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('Question', questionSchema);