'use strict';

var request = require('request')

exports.test = function(req, res) {
	// run whatever server side tests
	
	request.get({
			url: 'http://localhost:8080/api/upload/getCredentials?apikey=52f7caabff074a371800000b',
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