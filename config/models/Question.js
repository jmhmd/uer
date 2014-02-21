var mongoose = require('mongoose'),
	simpleTimestamps = require('mongoose-simpletimestamps').SimpleTimestamps

var questionSchema = new mongoose.Schema({
	stem: {type: String, required: 'A question stem is required'},
	answers: [
		{
			option: String,
			correct: {type: Boolean, default: false}
		}
	],
	category: String,
	difficulty: Number,
	studyId: String // id of study stored in casefil.es
})

questionSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('Question', questionSchema);