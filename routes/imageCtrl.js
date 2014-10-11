"use strict";

var util = require('util'),
	_ = require('lodash'),
	mongoose = require('mongoose'),
	Image = mongoose.model('Image'),
	validator = require('validator'),
	request = require('request'),
	secrets = require('../config/secrets'),
	casefiles = secrets.casefiles,
	async = require('async'),
	math = require('mathjs')()

/**
 * show page for uploading an image
 */
exports.addImage = function(req, res, next){
	
	casefiles.getUploadCreds(function(err, creds){
		if (err){ return next(err) }
		
		res.locals.uploadCreds = creds			
		res.locals.uploadKeyRoot = secrets.uploadKeyRoot
		
		res.render('addImage')
	})
}

exports.saveImage = function(req, res){

	/**
	 * Updating an existing image
	 */
	if (req.body._id){
		
		var id = req.body._id,
			imageObj = req.body
			
		delete imageObj._id

		Image.update({_id: req.body._id}, imageObj).exec(function(err, numAffected){
				if (err){return res.send(500, err)}
				
				if (numAffected > 0){
					res.send(200, 'Image object updated')
				} else {
					res.send(200, 'Image object not changed')
				}
			})
	}

	/**
	 * Saving a new image
	 */
	else {

		// create new mongoose quiz object
		var	image = new Image(req.body)

		image.creator = req.user._id

		image.save(function(err){
			if(err){ return res.send(500, err) }

			// send html if creating new quiz
			return res.send(201, image)
		})
	}
}