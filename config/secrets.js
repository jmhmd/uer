module.exports = {
	db: 'mongodb://localhost:27017/call-practice',

	sessionSecret: 'Your Session Secret goes here',

	// https://cloud.google.com/console/project
	google: {
		clientID: '515066226904-v3tlb5k6g3j83tdm1lbm6cmjbldb9ag3.apps.googleusercontent.com',
		clientSecret: 'D-kDAVtNTxt0caznOASmyaux',
		callbackURL: '/auth/google/callback',
		passReqToCallback: true
	}
}

var casefiles = {}

if (app.get('env') === 'development'){
	casefiles.apikey = '52f7caabff074a371800000b'
	casefiles.url = 'http://localhost:8080/'
} else {
	casefiles.apikey = ''
	casefiles.url = 'http://casefil.es/'
}

module.exports.casefiles = casefiles