'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('./models/User');
var secrets = require('./secrets');
var _ = require('lodash');

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

passport.use(new LocalStrategy({
	usernameField: 'email'
}, function(email, password, done) {
	User.findOne({
		email: email
	}, function(err, user) {
		if (!user) return done(null, false, {
			message: 'Email ' + email + ' not found'
		});
		user.comparePassword(password, function(err, isMatch) {
			if (isMatch) {
				return done(null, user);
			} else {
				return done(null, false, {
					message: 'Invalid email or password.'
				});
			}
		});
	});
}));

passport.use(new GoogleStrategy(secrets.google, function(req, accessToken, refreshToken, profile, done) {
	if (req.user) {
		User.findById(req.user.id, function(err, user) {
			user.google = profile.id;
			user.tokens.push({
				kind: 'google',
				accessToken: accessToken
			});
			user.profile.name = user.profile.name || profile.displayName;
			user.profile.gender = user.profile.gender || profile._json.gender;
			// user.profile.picture = user.profile.picture || profile._json.picture;
			user.save(function(err) {
				done(err, user);
			});
		});
	} else {
		User.findOne({
			$or: [
				{google: profile.id},
				{email: profile._json.email}
			]
		}, function(err, existingUser) {
			if (existingUser){
				/*
				Need to account for people who have created an account with a
				google email, then log in through google later
				 */
				if (!existingUser.google){
					existingUser.google = profile.id
					existingUser.tokens.push({
						kind: 'google',
						accessToken: accessToken
					})
					existingUser.save(function(err){
						return done(err, existingUser)
					})
				} else {
					return done(null, existingUser) 
				}
			}

			var user = new User();
			user.email = profile._json.email;
			user.google = profile.id;
			user.tokens.push({
				kind: 'google',
				accessToken: accessToken
			});
			user.profile.name = profile.displayName;
			user.profile.gender = profile._json.gender;
			// user.profile.picture = profile._json.picture;
			user.save(function(err) {
				done(err, user);
			});
		});
	}
}));

exports.isAuthenticated = function(req, res, next) {
	if (req.isAuthenticated()){ return next() }
	res.redirect('/login')
}

exports.isAuthenticatedAPI = function(req, res, next) {
	if (req.isAuthenticated()){ return next() }
	res.send(401, 'Action not permitted, must be logged in')
}

exports.isAdmin = function(req, res, next) {
	if (req.user.isAdmin){ return next() }
	res.send(401, 'Must be administrator')
}

exports.isAuthorized = function(req, res, next) {
	var provider = req.path.split('/').slice(-1)[0]
	if (_.findWhere(req.user.tokens, {
		kind: provider
	})){ next() }
	else{ res.redirect('/auth/' + provider) }
}
