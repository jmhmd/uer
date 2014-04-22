'use strict';

/* Select point on image directive */

var quizApp = angular.module('quizApp.select-point', [])	
quizApp.directive('selectPoint', [ '$interval',
	function($interval) {

		return {
			scope: {
				'selectPoint': '=',
				'imgSrc': '=',
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
					image = $('<img/>').css('height', '512px')

				element.append(marker)
				element.append(image)

				function setMarker(coords){

					marker.css('left', coords[0] - 13).css('top', coords[1] - 13)
					marker.show()
				}

				function removeMarker(){
					marker.hide()
				}

				image.on('click', function(e){

					console.log('clicked image')

					var offset = element.offset(),
						coords = [
							e.pageX - offset.left,
							e.pageY - offset.top
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

				// onQuestionChange()
			}
		}
	}]
)