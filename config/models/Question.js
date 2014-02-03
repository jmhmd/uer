var mongoose = require('mongoose'),
	simpleTimestamps = require('mongoose-SimpleTimestamps').SimpleTimestamps

var questionSchema = new mongoose.Schema({
	stem: {type: String, required: true},
	answers: [
		{
			optionId: Number,
			option: String,
			correct: {type: Boolean, default: false}
		}
	],
	category: String,
	studyId: String // id of study stored in casefil.es
})

questionSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('Question', questionSchema);