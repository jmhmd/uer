var mongoose = require('mongoose'),
	simpleTimestamps = require( "mongoose-SimpleTimestamps" ).SimpleTimestamps

var quizSchema = new mongoose.Schema({
	title: {type: String, required: 'A title is required'},
	difficulty: {type: String, required: true},
	questions: [mongoose.Schema.types]
})

quizSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('User', userSchema);