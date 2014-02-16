'use strict';

var request = require('request')

exports.test = function(req, res) {
	// run whatever server side tests
	
	request.get({
			url: 'http://localhost:8080/api/upload/getCredentials?apikey=52faa514a225b71d13000005',
			json: true
		},
		function(err, response, body) {

			if (err) {
				req.flash('errors', err)
			}
			res.locals.s3 = body
			
			res.render('test')
		})

}