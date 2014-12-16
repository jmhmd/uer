$(document).ready(function(){

	var placeMarker = function(el, coords, color){
		console.log('imgheight: ', el.naturalHeight)

		if (!el || !coords || coords === '' || coords.length === 0){ return false }

		// put crosshairs on it
		var w = el.naturalWidth,
			//h = el.naturalHeight,
			ratio = w / $(el).width(),
			//offset = $(el).offset(),
			marker = $('<span></span>').addClass('glyphicon glyphicon-screenshot').css({'position': 'absolute', 'color': color}),
			//loc = coords.split(',').map(function(i){return parseInt(i)}),
			loc = coords,
			mTop = (loc[1] / ratio),
			mLeft = (loc[0] / ratio)

		marker.css({'top': mTop, 'left': mLeft})
		// $('body').append(marker)
		$(el).parent().append(marker)
	}

	var lazyImages = $('.lazy-load')

	lazyImages.each(function(){

		var studyId = $(this).attr('data-src')

		if (!studyId){ return true }

		// load image object and set 'this' in callback to <img> element
		$.ajax({url: '/api/getImageObject/' + studyId, dataType: 'json', context: this})
				.done(function(res) {

					console.log('loaded image: ', res)

					$(this)
						.one('load', function(e){

							var el = e.target,
								userCoords = $(el).attr('data-loc'),
								goldStandardCoords = $(el).attr('data-gold-standard-loc')


							console.log('coords:',JSON.parse(userCoords))
							console.log('gold:', goldStandardCoords)

							userCoords = JSON.parse(userCoords)
							// return false

							/*// put in array if not already
							userCoords = userCoords.indexOf('[') !== 0 ? '[' + userCoords + ']' : userCoords
							goldStandardCoords = goldStandardCoords.indexOf('[') !== 0 ? '[' + goldStandardCoords + ']' : goldStandardCoords

							// console.log('coords:',userCoords)
							// parse as JSON
							userCoords = JSON.parse(userCoords)
							goldStandardCoords = JSON.parse(goldStandardCoords)*/


							if ($.isArray(userCoords)){
								$.each(userCoords, function(i, coords){
									placeMarker(el, coords.coords, 'red')
								})
							} else {
								placeMarker(el, userCoords.coords, 'red')
							}

							if ($.isArray(goldStandardCoords[0])){
								$.each(goldStandardCoords, function(i, coords){
									placeMarker(el, coords, 'yellow')
								})
							} else {
								placeMarker(el, goldStandardCoords, 'yellow')
							}

							
						})
						.attr('src', res.imageStacks[0].imagePaths[0])
						.each(function() {
							console.log('imgh: ', this.naturalHeight)
							//Cache fix for browsers that don't trigger .load()
							if(this.complete){ $(this).trigger('load') }
						})
					
				})
				.fail(function(err) {

					console.error(err)
				})
	})
})