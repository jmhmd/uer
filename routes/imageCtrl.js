"use strict";

var util = require('util'),
	_ = require('lodash'),
	mongoose = require('mongoose'),
	ImageModel = mongoose.model('Image'),
	validator = require('validator'),
	request = require('request'),
	secrets = require('../config/secrets'),
	quiz = require('./quiz'),
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

/**
 * Load study object from casefiles API
 * @param  {String} id Unique id for study in casefiles
 * @return {String}    JSON object of study
 */
var _getImageObject = function(id, cb){

	var url = casefiles.url + 'api/study/load/' + id + '?apikey=' + casefiles.apikey

	request.get({
			url: url
		}, function(err, response, body){
			if (err) { return cb(err) }
			if (response.statusCode !== 200){ return cb(body) }
			cb(null, JSON.parse(body))
		})
}

exports.getImages = function(req, res, next){

	ImageModel.find({}, function(err, images){
		if (err){
			console.log('Error finding images', err)
			return next(err)
		}

		/*var ids = _.map(images, function(img){ return img.studyId })

		if (images.length > 0){

			async.map(ids, _getImageObject, function(err, imgObjs){
				if (err){
					console.log(err)
					return next(err)
				}

				// imgObjs = JSON.parse(imgObjs)

				res.locals.images = _.map(imgObjs, function(img){ return img.imageStacks[0].imagePaths[0] })
				console.log(res.locals.images)

				return res.render('images')
			})

		}*/

		res.locals.images = images
		return res.render('images')
	})
}

exports.saveImage = function(req, res){

	console.log(req.body)

	/**
	 * Updating an existing image
	 */
	if (req.body._id){
		
		var id = req.body._id,
			imageObj = req.body
			
		delete imageObj._id

		ImageModel.update({_id: id}, imageObj).exec(function(err, numAffected){
				if (err){return res.send(500, err)}

				console.log("number affected:", numAffected)
				
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

		if (!req.body.title && req.body.diagnosis){ req.body.title = req.body.diagnosis }

		// create new mongoose quiz object
		var	image = new ImageModel(req.body)

		image.creator = req.user._id

		image.save(function(err){
			if(err){ return res.send(500, err) }

			// send html if creating new quiz
			return res.send(201, image)
		})
	}
}