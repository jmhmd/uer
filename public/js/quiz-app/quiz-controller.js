'use strict';

/* Controllers */

var quizApp = angular.module('quizApp.controllers', [])	
quizApp.controller('questionCtrl', ['$scope', '$http', '$window',
	function($scope, $http, $window) {

		// make linter happy
		//var quiz = quiz
		
		$scope.quiz = quiz
		$scope.quizResult = quizResult
		$scope.currentIndex = null
		$scope.currentQuestion = {}


		var _init = function(){
			
			$scope.gotoQuestion(0)

			// may want to preload all images in background at some point
			
		}

		var _getQuestion = function(index){

			var questionId = $scope.quizResult.quizQuestions[index].questionId,
				question = _.find($scope.quiz.questions, {_id: questionId})

			return question			
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

			$scope.saveProgress()

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

		$scope.saveProgress = function(cb){

			cb = cb || angular.noop

			$http.post('/api/saveQuizProgress', $scope.quizResult)
				.success(function(res){
					console.log('quiz saved: ', res)
					cb(null)
				})
				.error(function(err){
					console.log('error saving quiz: ', err)
					cb(err)
				})
		}

		$scope.submitAndFinish = function(){

			if(!window.confirm('Are you sure? Once you submit you cannot go back and change answers.')){
				return false
			}

			$scope.quizResult.completed = true

			$scope.saveProgress(function(err){
				if (err){ return console.log(err) }

				$window.location.href = '/quiz/result/' + $scope.quizResult._id
			})
		}		

		_init()


		/**
		 * test
		 */
		$scope.test = true
	}
])