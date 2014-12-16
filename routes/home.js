'use strict';

exports.partials = function (req, res) {
	res.render('partials/' + req.params.partial)
}

exports.index = function(req, res){
	if (req.isAuthenticated()){
		console.log(req.originalUrl)
		res.redirect('/tutorial')
	} else {
		res.render('home')
	}
}