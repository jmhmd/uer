var request = require('request')

module.exports = {
	db: 'mongodb://localhost:27017/uer',

	sessionSecret: 'uer',

	// https://cloud.google.com/console/project
	google: {
		clientID: '515066226904-v3tlb5k6g3j83tdm1lbm6cmjbldb9ag3.apps.googleusercontent.com',
		clientSecret: 'D-kDAVtNTxt0caznOASmyaux',
		callbackURL: '/auth/google/callback',
		passReqToCallback: true
	}
}

var casefiles = {},
	uploadKeyRoot = "uploads/temp/"

/*if (process.env.NODE_ENV === 'development'){

	// casefiles.apikey = '52f7caabff074a371800000b' // on powerbook
	casefiles.apikey = '52faa514a225b71d13000005' // on imac
	casefiles.url = 'http://localhost:8080/' // must include trailing slash
	uploadKeyRoot = "uploads/temp/"
} else */

if (process.env.NODE_ENV === 'production'){

	casefiles.apikey = ''
	casefiles.url = 'http://casefil.es/' // must include trailing slash
	uploadKeyRoot = "uploads/"
}
else {

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