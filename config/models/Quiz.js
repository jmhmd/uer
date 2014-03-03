var mongoose = require('mongoose'),
	simpleTimestamps = require('mongoose-simpletimestamps').SimpleTimestamps

var quizSchema = new mongoose.Schema({
	title: {type: String, required: 'A title is required'},
	difficulty: {type: Number, required: 'Must select difficulty'},
	type: {
		type: String, 
		enum: [
			'module',
			'random'
		],
		default: 'module'
	},
	questions: [{type: mongoose.Schema.Types.ObjectId, ref: 'Question'}],
	deleted: {type: Boolean, default: false}
})

quizSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('Quiz', quizSchema);