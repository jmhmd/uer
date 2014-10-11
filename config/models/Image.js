'use strict';

var mongoose = require('mongoose'),
	simpleTimestamps = require('mongoose-simpletimestamps').SimpleTimestamps

var imageSchema = new mongoose.Schema({
	creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	title: {type: String, required: 'A title is required'},
	difficulty: {type: String, required: 'Must select difficulty'},
	diagnosis: String,
	pathProven: {type: Boolean, default: false},
	normal: {type: Boolean, default: false},
	foreignId: {type: String, required: true},
	studyId: String,
	deleted: {type: Boolean, default: false}
})

imageSchema.plugin(simpleTimestamps)

module.exports = mongoose.model('Image', imageSchema);