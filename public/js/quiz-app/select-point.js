'use strict';

/* Select point on image directive */

var quizApp = angular.module('quizApp.select-point', [])	
quizApp.directive('selectPoint', [ '$interval',
	function($interval) {

		return {
			scope: {
				'selectPoint': '=',
				'imgSrc': '=',
				'imgHeight': '=',
				'imgWidth': '=',
				'index': '='
			},
			link: function(scope, element, attrs){

				element.css('position', 'relative')

				var marker = $('<div/>', {
						id: 'point-marker'
					})
					.css({
						width: '20px',
						height: '20px',
						position: 'absolute',
						'border-style': 'solid',
						'border-color': 'red',
						'border-width': 'solid',
						'border-radius': '50%',
						display: 'none',
						'z-index': '1'
					}),
					image = $('<img/>').css({
						'height': scope.imgHeight,
						'width': scope.imgWidth
					})

				element.append(marker)
				element.append(image)

				function setMarker(coords){

					console.log('image dim: ', image.width(), image.height())

					var x = coords[0] * image.width(),
						y = coords[1] * image.height()

					marker.css('left', x - 13).css('top', y - 13)
					marker.show()
				}

				function removeMarker(){
					marker.hide()
				}

				image.on('click', function(e){

					console.log('clicked image')

					var offset = image.offset(),
						iWidth = image.width(),
						iHeight = image.height(),
						coords = [
							(e.pageX - offset.left) / iWidth,
							(e.pageY - offset.top) / iHeight
						]

					scope.$apply(function(){
						scope.selectPoint.coords = coords
					})

					setMarker(coords)					
				})

				scope.$watch('index', function(){
					if (scope.selectPoint.coords.length > 0){
						setMarker(scope.selectPoint.coords)
					} else {
						removeMarker()
					}
				})

				scope.$watch('imgSrc', function(){
					console.log('change image to: ', scope.imgSrc)
					image.attr('src', scope.imgSrc)
				})

				scope.$watch('imgHeight', function(height){
					image.css('height', height)
				})

				scope.$watch('imgWidth', function(width){
					image.css('width', width)
				})

				// onQuestionChange()
			}
		}
	}]
)