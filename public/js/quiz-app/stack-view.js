'use strict';

/* Select point on image directive */

var quizApp = angular.module('quizApp.stack-view', [])	
quizApp.directive('stackView', [ '$window', 'Timer',
	function($window, Timer) {

		return {
			scope: {
				'selectPoint': '=',
				'isNormal': '=',
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

					viewer.unMount()

					console.log('load new image: ' + scope.imgSrc)

					if ($.isFunction(unbindSrcWatch)){ unbindSrcWatch() }

					if (!scope.imgSrc){

						// display "no image" placeholder
						var pHCont = $('#placeholder').parent(),
							placeholder = 'http://placehold.it/'+pHCont.width()+'x'+pHCont.height()+'+&text=No+image+for+this+case.'

						$('#stackview').hide()
						$('#placeholder').attr('src', placeholder).show()
						
						// setup watch for change if loaded
						unbindSrcWatch = scope.$watch('imgSrc', function(newSrc, oldSrc){
							if (!newSrc){ return false }

							// show viewer, hide placeholder
							$('#stackview').show()
							$('#placeholder').hide()

							viewer.render({images: [newSrc]}, element, {activeControl: 'markPoint'})
							/*viewer.addHook('beforeAddAnnotation', function(next){
								// viewer.clearAnnotations()
								next()
							})*/

							var points = scope.selectPoint.map(function(p){ return {type:'point', image: 0, coords: p.coords} })

							viewer.loadAnnotations(points)
							// viewer.loadAnnotations([{type:'point', image: 0, coords: scope.selectPoint[0].coords}])

							// resize viewer
							$(document).trigger('resize-viewer')

							unbindSrcWatch()
						})
					} else {
						
						// show viewer, hide placeholder
						$('#stackview').show()
						$('#placeholder').hide()

						viewer.render({images: [scope.imgSrc]}, element, {activeControl: 'markPoint'})
						/*viewer.addHook('beforeAddAnnotation', function(next){
							// viewer.clearAnnotations()
							next()
						})*/
						
						var points = scope.selectPoint.map(function(p){ return {type:'point', image: 0, coords: p.coords} })

						viewer.loadAnnotations(points)
						// viewer.loadAnnotations([{type:'point', image: 0, coords: scope.selectPoint[0].coords}])
						
						// resize viewer
						$(document).trigger('resize-viewer')
					}				
				})

				$(viewer).on('mark-point', function(){

					console.log('marked point')
					
					var annotations = viewer.getAnnotations()

					var coords = annotations.map(function(a){ return a.coords })

					coords.forEach(function(p,i){
						if (!scope.selectPoint[i]){ scope.selectPoint[i] = {} }
						scope.selectPoint[i].coords = p
					})

					var timeElapsed = Timer.getObjectElapsed(scope.index)

					console.log('time:', timeElapsed)

					scope.selectPoint[scope.selectPoint.length - 1].time = timeElapsed

					if (coords.length > 0){
						scope.isNormal = false
					} else {
						scope.isNormal = true
					}

					console.log(scope.selectPoint)
					//scope.selectPoint[0].coords = annotations[0].coords
				})

				$(viewer).on('clear-annotations', function(){

					console.log('clear annotations')

					scope.selectPoint = []
				})

				$($window).on('resize', function(){
					viewer.resetCanvas()
				})

			}
		}
	}]
)