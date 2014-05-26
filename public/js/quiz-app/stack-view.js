'use strict';

/* Select point on image directive */

var quizApp = angular.module('quizApp.stack-view', [])	
quizApp.directive('stackView', [
	function() {

		return {
			scope: {
				'selectPoint': '=',
				'imgSrc': '=',
				'imgHeight': '=',
				'imgWidth': '=',
				'index': '='
			},
			link: function(scope, element, attrs){

				var viewer = viewerMaker(),
					unbindSrcWatch

				scope.$watch('index', function(newIndex, oldIndex){
					if (newIndex !== 0 && newIndex === oldIndex){ return false }
					console.log('load new image: ' + scope.imgSrc)

					if ($.isFunction(unbindSrcWatch)){ unbindSrcWatch() }

					if (!scope.imgSrc){

						// display "no image" placeholder
						// 
						
						// setup watch for change if loaded
						unbindSrcWatch = scope.$watch('imgSrc', function(newSrc, oldSrc){
							if (!newSrc){ return false }
							viewer.render({images: [newSrc]}, element)
							unbindSrcWatch()
						})
					} else {
						viewer.render({images: [scope.imgSrc]}, element)
					}				
				})

				$(viewer).on('mark-point', function(){
					console.log(viewer.getAnnotations())
				})

				/*scope.$watch('imgSrc', function(newSrc, oldSrc){
					if (newSrc === oldSrc){ return false }

					console.log('change image to: ', scope.imgSrc)
					image.attr('src', scope.imgSrc)

					imagesLoaded(image).on('done', function(){

						console.log('image done loading')

						scope.$apply(function(){

							if (scope.selectPoint.coords.length > 0){
								// $timeout(function(){setMarker(scope.selectPoint.coords)}, 10)
								setMarker(scope.selectPoint.coords)
							} else {
								removeMarker()
							}
						})
					})
				})

				scope.$watch('imgHeight', function(height){
					image.css('height', height)
				})

				scope.$watch('imgWidth', function(width){
					image.css('width', width)
				})*/

				// onQuestionChange()
			}
		}
	}]
)