'use strict';

var mongoose = require('mongoose'),
	passport = require('passport'),
	_ = require('lodash'),
	User = mongoose.model('User'),
	request = require('request'),
	casefiles = require('../config/secrets').casefiles

/**
 * GET /login
 * Login page.
 */

exports.getLogin = function(req, res) {
	if (req.user) return res.redirect('/');
	res.render('account/login', {
		title: 'Login'
	});
};

/**
 * POST /login
 * Sign in using email and password.
 * @param {string} email
 * @param {string} password
 */

exports.postLogin = function(req, res, next) {
	req.assert('email', 'Email is not valid').isEmail();
	req.assert('password', 'Password cannot be blank').notEmpty();

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect('/login');
	}

	passport.authenticate('local', function(err, user, info) {
		if (err) return next(err);

		if (!user) {
			req.flash('errors', {
				msg: info.message
			});
			return res.redirect('/login');
		}

		req.logIn(user, function(err) {
			if (err) return next(err);
			return res.redirect('/');
		});
	})(req, res, next);
};

/**
 * GET /signup
 * Signup page.
 */

exports.getSignup = function(req, res) {
	if (req.user) { return res.redirect('/') }
	res.render('account/signup')
}

/**
 * POST /signup
 * Create a new local account.
 * @param {string} email
 * @param {string} password
 */

exports.postSignup = function(req, res, next) {
	req.assert('email', 'Email is not valid').isEmail();
	req.assert('password', 'Password must be at least 4 characters long').len(4);
	req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect('/signup');
	}

	var user = new User({
		email: req.body.email,
		password: req.body.password
	});

	user.save(function(err) {
		if (err) {
			if (err.code === 11000) {
				req.flash('errors', {
					msg: 'User with that email already exists.'
				});
			}
			return res.redirect('/signup');
		}
		req.logIn(user, function(err) {
			if (err) return next(err);
			res.redirect('/');
		});
	});
};

/**
 * GET /account
 * Profile page.
 */

exports.getAccount = function(req, res) {
	res.render('account/profile', {
		title: 'Account Management'
	});
};

/**
 * POST /account/profile
 * Update profile information.
 */

exports.postUpdateProfile = function(req, res, next) {
	User.findById(req.user.id, function(err, user) {
		if (err) return next(err);
		user.email = req.body.email || '';
		user.profile.name = req.body.name || '';
		user.profile.gender = req.body.gender || '';
		user.profile.location = req.body.location || '';
		user.profile.website = req.body.website || '';

		user.save(function(err) {
			if (err) return next(err);
			req.flash('success', {
				msg: 'Profile information updated.'
			});
			res.redirect('/account');
		});
	});
};

/**
 * POST /account/password
 * Update current password.
 * @param {string} password
 */

exports.postUpdatePassword = function(req, res, next) {
	req.assert('password', 'Password must be at least 4 characters long').len(4);
	req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect('/account');
	}

	User.findById(req.user.id, function(err, user) {
		if (err) return next(err);

		user.password = req.body.password;

		user.save(function(err) {
			if (err) return next(err);
			req.flash('success', {
				msg: 'Password has been changed.'
			});
			res.redirect('/account');
		});
	});
};

/**
 * POST /account/delete
 * Delete user account.
 * @param {string} id
 */

exports.postDeleteAccount = function(req, res, next) {
	User.remove({
		_id: req.user.id
	}, function(err) {
		if (err) return next(err);
		req.logout();
		res.redirect('/');
	});
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth2 provider from the current user.
 * @param {string} provider
 * @param {string} id
 */

exports.getOauthUnlink = function(req, res, next) {
	var provider = req.params.provider;
	User.findById(req.user.id, function(err, user) {
		if (err) return next(err);

		user[provider] = undefined;
		user.tokens = _.reject(user.tokens, function(token) {
			return token.kind === provider;
		});

		user.save(function(err) {
			if (err) return next(err);
			req.flash('info', {
				msg: provider + ' account has been unlinked.'
			});
			res.redirect('/account');
		});
	});
};

exports.getMakeAdmin = function(req, res, next){

	User.find().exec(function(err, users){
		if (err){ return next(err) }

		console.log(users)

		res.locals.users = users
		res.render('account/makeAdmin')
	})
}

/**
 * POST /account/makeAdmin
 * make a user an admin, must check with casefil.es to give upload access
 * @return {Object} JSON response
 */
exports.makeAdmin = function(req, res, next){
	var userId = req.params.userId || req.body.userId

	// pull user from db
	User.findById(userId, function(err, user){
		if (err){ 
			console.log(err)
			return next(err)
		}

		if (!user || !user.email) { return res.send(400, 'User does not have email on file') }
		
		// try to associate this user with an account on casefil.es
		request.post({
				url: casefiles.url + 'api/user/addToAffiliation', 
				json: {
					email: user.email,
					apikey: casefiles.apikey
				}
			},
			function(err, response, body){
				if (err){ return next(err) }
				if (response.statusCode !== '200'){ return next(body) }

				// user successfully created, make admin
				setAsAdmin(user)
			})
	})

	function setAsAdmin(user){
		if (user.isAdmin){
			res.send(200, 'User already administrator')
		} else {
			user.isAdmin = true
			user.save(function(err){
				if (err){ return next(err) }
				res.send(200, 'User set as administrator')
			})
		}
	}
}

/**
 * GET /logout
 * Log out.
 */

exports.logout = function(req, res) {
	req.logout();
	res.redirect('/');
};