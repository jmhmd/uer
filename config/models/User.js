'use strict';

var mongoose = require('mongoose'),
	bcrypt = require('bcrypt-nodejs'),
	simpleTimestamps = require('mongoose-simpletimestamps').SimpleTimestamps

var userSchema = new mongoose.Schema({
	email: {
		type: String,
		unique: true
	},
	password: String,

	google: {
		type: String,
		unique: true,
		sparse: true
	},
	
	tokens: Array,

	isAdmin: {type: Boolean, default: false},

	profile: {
		name: {
			type: String,
			default: ''
		},
		gender: {
			type: String,
			default: ''
		},
		trainingLevel: {
			type: String,
			default: ''
		},
		specialty: {
			type: String,
			default: ''
		},
		otherSpecialty: String // should only be set if specialty is set to "Other"
	}
})

userSchema.plugin(simpleTimestamps)

/**
 * Hash the password for security.
 */

userSchema.pre('save', function(next) {
	var user = this,
		SALT_FACTOR = 5

	if (!user.isModified('password')){ return next() }

	bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
		if (err){ return next(err) }

		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err){ return next(err) }
			user.password = hash
			next()
		})
	})
})

userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err){ return cb(err) }
		cb(null, isMatch)
	})
}

module.exports = mongoose.model('User', userSchema)