'use strict';

/*
 * Serve JSON to our AngularJS client
 */
exports.name = function(req, res) {
	res.json({
		name: 'Bob'
	})
}

// not sure we even need this, as our client can query the casefil.es api directly
/*exports.loadStudy = function(req, res){

}*/