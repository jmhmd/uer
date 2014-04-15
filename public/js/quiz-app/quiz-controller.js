'use strict';

/* Controllers */

var quizApp = angular.module('quizApp.controllers', [])	
quizApp.controller('questionCtrl', ['$scope', '$http',
	function($scope, $http) {

		// make linter happy
		//var quiz = quiz
		
		$scope.quiz = quiz
		$scope.quizResult = quizResult
		$scope.currentQuestion = {}


		var _init = function(){
			
			$scope.currentIndex = 0

			$scope.gotoQuestion($scope.currentIndex)

			// may want to preload all images in background at some point
			_loadImage($scope.currentIndex)
		}

		$scope.currentQuestion = function(){

			//console.log('current question is: ', $scope.currentIndex, $scope.quiz.questions[$scope.currentIndex])

			return $scope.quiz.questions[$scope.currentIndex]
		}

		var _getQuestion = function(index){

			var questionId = $scope.quizResult.quizQuestions[index].questionId,
				question = _.find($scope.quiz.questions, {_id: questionId})

			return question			
		}

		$scope.gotoQuestion = function(index){

			var question = _getQuestion(index)

			if ($scope.isCurrentQuestion(index)){
				return false
			}
			
			console.log('goto question: ', index)
			
			$scope.currentQuestion = question
			$scope.currentIndex = index

			if (!question.imageSeries){
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

			var studyId = _getQuestion(index).studyId

			console.log('loading image with study id: ', studyId)

			$http.get('/api/getImageObject/' + studyId)
				.success(function(res) {

					console.log('loaded image: ', res)

					_getQuestion(index).imageSeries = res.imageStacks
				})
				.error(function(err) {

					console.error(err)
				})
		}

		_init()
	}
])