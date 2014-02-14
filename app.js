'use strict';
/**
 * Module dependencies
 */

var express = require('express'),
	MongoStore = require('connect-mongo')(express),
	flash = require('express-flash'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	expressValidator = require('express-validator'),
	http = require('http'),
	path = require('path'),
	hbs = require('express-hbs')

var app = module.exports = express()

/**
 *  Load Routes
 */
var userCtrl = require('./routes/user'),
	apiCtrl = require('./routes/api'),
	homeCtrl = require('./routes/home'),
	quizCtrl = require('./routes/quiz'),
	testCtrl = require('./routes/test')


/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets'),
	passportConf = require('./config/passport')

/**
 * Mongoose configuration.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
	console.log('✗ MongoDB Connection Error. Please make sure MongoDB is running.'.red)
})


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000)
app.engine('hbs', hbs.express3({
  partialsDir: __dirname + '/views/partials'
}))
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(expressValidator())
app.use(express.methodOverride())
app.use(express.cookieParser())
app.use(express.session({
	secret: secrets.sessionSecret,
	store: new MongoStore({
		db: mongoose.connection.db,
		auto_reconnect: true
	})
}))
app.use(passport.initialize())
app.use(passport.session())
// make logged in user object available to templates
app.use(function(req, res, next) {
	res.locals.user = req.user
	next()
})
app.use(flash())
app.use(express.static(path.join(__dirname, 'public')))
app.use(app.router)

// development only
if (app.get('env') === 'development') {
	app.use(express.errorHandler())
}

// production only
if (app.get('env') === 'production') {
	// production error handling
	app.use(function(err, req, res, next){
		console.error(err.stack);
		res.send(500, 'Something broke!');
	})
}


////////////
// Routes //
////////////

/**
 * JSON API
 */
// app.get('/api/loadStudy/:studyId', apiCtrl.loadStudy)
// app.post('/api/saveStudy/:studyId', apiCtrl.saveStudy)


/**
 * APP ROUTES
 */

// User account
app.get('/login', userCtrl.getLogin)
app.post('/login', userCtrl.postLogin)
app.get('/logout', userCtrl.logout)
app.get('/signup', userCtrl.getSignup)
app.post('/signup', userCtrl.postSignup)

// App navigation
app.get('/', homeCtrl.index)
app.get('/quiz/:quizId', quizCtrl.showQuiz)
app.get('/quiz/:quizId/:questionId', quizCtrl.showQuestion)
app.get('/quiz/:quizId/results', quizCtrl.showResults)

// API
app.post('/makeAdmin', passportConf.isAuthenticatedAPI, passportConf.isAdmin, userCtrl.makeAdmin)
app.post('/saveQuiz', passportConf.isAuthenticatedAPI, passportConf.isAdmin, quizCtrl.saveQuiz)
app.post('/saveQuestion', passportConf.isAuthenticatedAPI, passportConf.isAdmin, quizCtrl.saveQuestion)
app.post('/saveImages', passportConf.isAuthenticatedAPI, passportConf.isAdmin, quizCtrl.saveImages)

// Partials
app.get('/partials/:partial', homeCtrl.partials)

// Tests
app.get('/test', testCtrl.test)


/**
 * OAuth routes for sign-in.
 */

app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));

// redirect all others to the index
app.get('*', homeCtrl.index)

/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'))
})