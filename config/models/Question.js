var mongoose = require('mongoose'),
	simpleTimestamps = require('mongoose-simpletimestamps').SimpleTimestamps

var questionSchema = new mongoose.Schema({
	clinicalInfo: String,
	stem: {type: String, required: 'A question stem is required'},
	choices: [
		{
			option: String,
			explanation: String,
			correct: {type: Boolean, default: false}
		}
	],
	diagnosis: String,
	category: String,
	difficulty: Number,
	studyId: String, // id of study stored in casefil.es
	deleted: {type: Boolean, default: false}
})

questionSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('Question', questionSchema);