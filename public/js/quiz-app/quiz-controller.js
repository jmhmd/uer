'use strict';

/* Controllers */

var quizApp = angular.module('quizApp.controllers', [])	
quizApp.controller('questionCtrl', ['$scope', '$http',
	function($scope, $http) {

		// make linter happy
		//var quiz = quiz
		
		$scope.quiz = quiz


		var _init = function(){
			
			$scope.currentIndex = 0

			// may want to preload all images in background at some point
			_loadImage($scope.currentIndex)
		}

		$scope.currentQuestion = function(){

			//console.log('current question is: ', $scope.currentIndex, $scope.quiz.questions[$scope.currentIndex])

			return $scope.quiz.questions[$scope.currentIndex]
		}

		$scope.gotoQuestion = function(index){

			if ($scope.isCurrentQuestion(index)){
				return false
			}
			
			console.log('goto question: ', index)
			
			$scope.currentIndex = index

			if (!$scope.quiz.questions[index].imageSeries){
				_loadImage(index)
			}

		}

		$scope.isCurrentQuestion = function(index){

			return index === $scope.currentIndex
		}

		$scope.nextQuestion = function(){

			if ($scope.currentIndex + 1 !== $scope.quiz.questions.length){
				$scope.gotoQuestion($scope.currentIndex + 1)
			}
		}

		$scope.prevQuestion = function(){

			if ($scope.currentIndex !== 0){
				$scope.gotoQuestion($scope.currentIndex - 1)
			}
		}

		var _loadImage = function(index){

			var studyId = $scope.quiz.questions[index].studyId

			console.log('loading image with study id: ', studyId)

			$http.get('/api/getImageObject/' + studyId)
				.success(function(res) {

					console.log('loaded image: ', res)

					$scope.quiz.questions[index].imageSeries = res.imageStacks
				})
				.error(function(err) {

					console.error(err)
				})
		}

		_init()
	}
])