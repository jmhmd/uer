var request = require('request')

module.exports = {

	sessionSecret: 'uer',

	// https://cloud.google.com/console/project
	google: {
		clientID: '713353189126-lijana0bk1kfifnchcd4ga0pdj3ggnv8.apps.googleusercontent.com',
		clientSecret: '3GJsgophYKqymuME93ldeATo',
		callbackURL: '/auth/google/callback',
		passReqToCallback: true
	}
}

if (process.env.NODE_ENV === 'production') {
	module.exports.db = 'mongodb://jasonhostetter.com:27017/uer-prod'
} else {
	module.exports.db = 'mongodb://jasonhostetter.com:27017/uer-dev'
}

var casefiles = {},
	uploadKeyRoot = "uploads/temp/"

if (process.env.NODE_ENV === 'production'){
	casefiles.apikey = '5434601901526451448c69ee'
	casefiles.url = 'http://casefil.es/' // must include trailing slash
	uploadKeyRoot = "uploads/"
} else {
	casefiles.apikey = '53829e6a33738ebc673df6a1'
	casefiles.url = 'http://dev.casefil.es/' // must include trailing slash
	uploadKeyRoot = "uploads/temp/"
}

casefiles.getUploadCreds = function(cb){
	request.get({
			url: casefiles.url + 'api/upload/getCredentials?apikey=' + casefiles.apikey,
			json: true
		},
		function(err, response, body){
			if (response && response.statusCode !== 200 && !err){ err = body }
			cb(err, body)
		})
}

module.exports.casefiles = casefiles
module.exports.uploadKeyRoot = uploadKeyRoot