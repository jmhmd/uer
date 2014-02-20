'use strict';

var request = require('request'),
	casefiles = require('../config/secrets').casefiles

exports.test = function(req, res) {
	// run whatever server side tests
	
	request.get({
			url: casefiles.url + 'api/upload/getCredentials?apikey=' + casefiles.apikey,
			json: true
		},
		function(err, response, body) {

			if (err) {
				console.log(err)
				req.flash('errors', err)
			}
			res.locals.s3 = body
			res.locals.casefiles = casefiles
			
			res.render('test')
		})

}