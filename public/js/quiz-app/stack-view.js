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

							viewer.render({images: [newSrc]}, element, {activeControl: 'markPoint'})
							viewer.addHook('beforeAddAnnotation', function(next){
								viewer.clearAnnotations()
								next()
							})
							viewer.loadAnnotations([{type:'point', image: 0, coords: scope.selectPoint.coords}])

							unbindSrcWatch()
						})
					} else {
						viewer.render({images: [scope.imgSrc]}, element, {activeControl: 'markPoint'})
						viewer.addHook('beforeAddAnnotation', function(next){
							viewer.clearAnnotations()
							next()
						})
						viewer.loadAnnotations([{type:'point', image: 0, coords: scope.selectPoint.coords}])
					}				
				})

				$(viewer).on('mark-point', function(){
					var annotations = viewer.getAnnotations()

					if (annotations[0]){
						scope.selectPoint.coords = annotations[0].coords
					}
				})

			}
		}
	}]
)