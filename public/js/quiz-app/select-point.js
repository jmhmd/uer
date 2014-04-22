'use strict';

/* Select point on image directive */

var quizApp = angular.module('quizApp.select-point', [])	
quizApp.directive('selectPoint', [ '$interval',
	function($interval) {

		return {
			scope: {
				'selectPoint': '=',
				'imgSrc': '='
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
					image = $('<img/>')

				element.append(marker)
				element.append(image)

				image.on('click', function(e){

					var offset = element.offset(),
						coords = [
							e.pageX - offset.left,
							e.pageY - offset.top
						]

					scope.$apply(function(){
						scope.selectPoint.coords = coords
					})

					marker.css('left', coords[0] - 13).css('top', coords[1] - 13)

					marker.show()
				})

				scope.$watch('imgSrc', function(val){
					image.attr('src', val)
				})
			}
		}
	}]
)