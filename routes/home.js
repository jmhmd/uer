'use strict';

exports.partials = function (req, res) {
	res.render('partials/' + req.params.partial)
}

exports.index = function(req, res){
	res.render('home')
}