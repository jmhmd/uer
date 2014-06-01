var util = require('util'),
	_ = require('lodash'),
	mongoose = require('mongoose'),
	fs = require('fs'),
	path = require('path')

var secrets = require('./config/secrets')

/**
 * Mongoose configuration.
 */

mongoose.connect(secrets.db);
mongoose.connection
	.on('error', function() {
		console.log('MongoDB Connection Error. Please make sure MongoDB is running.'.red)
	})
	.on('open', function() {
		console.log('DB connected, using ' + mongoose.connection.name)
	})

fs.readdirSync('./config/models').forEach(function(file) {
	require(path.join(__dirname, 'config/models/', file))
})

var Quiz = mongoose.model('Quiz'),
	Question = mongoose.model('Question')

Question.findOne({'choices': { $elemMatch: {'_id': '533769c879c6f6f411b1bfad'}}}, function(err, result){
	if (err){ console.log(err) }
	console.log(result)
})
