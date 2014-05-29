'use strict';

/* Controllers */

var quizApp = angular.module('quizApp.controllers', [])	
quizApp.controller('questionCtrl', ['$scope', '$http', '$window', '$interval', 'Timer',
	function($scope, $http, $window, $interval, Timer) {
		
		$scope.quiz = quiz
		$scope.quizResult = quizResult
		$scope.currentIndex = null
		$scope.currentQuestion = {}
		$scope.elapsedTime = "00:00:00" // should be time formatted string
		var partials = {
			question: '/html/quiz.question.html',
			paused: '/html/quiz.paused.html'
		}
		$scope.questionPartial = partials.question
		$scope.paused = false


		var _init = function(){
			
			$scope.gotoQuestion(0)

			// may want to preload all images in background at some point
			// ...

			$interval(function(){
				$scope.elapsedTime = Timer.msToTime(Timer.getTotalElapsed())
			}, 1000)
		}

		var _getQuestion = function(index){

			var questionId = $scope.quizResult.quizQuestions[index].questionId,
				question = _.find($scope.quiz.questions, {_id: questionId})

			return question			
		}

		var _loadImage = function(index, cb){

			var studyId = _getQuestion(index).studyId

			console.log('loading image with study id: ', studyId)

			$http.get('/api/getImageObject/' + studyId)
				.success(function(res) {

					console.log('loaded image: ', res)

					_getQuestion(index).imageSeries = res.imageStacks

					if ($.isFunction(cb)){ cb() }
				})
				.error(function(err) {

					console.error(err)
				})
		}

		var _onQuestionLoad = function(index){

			// create timer for question if not already created
			if (!Timer.isTimedObject(index)){
				Timer.createTimedObject(index)
			}

			// start timer
			Timer.startTimer(index)
		}

		var _saveQuestionTime = function(index){

			// save time for question
			var questionResult = $scope.quizResult.quizQuestions[index]
			questionResult.questionTime = Timer.getObjectElapsed(index)
		}

		var _onQuestionUnload = function(index){
			console.log('unload question '+index)

			_saveQuestionTime(index)

			$scope.saveProgress()
			
			// stop question timer
			Timer.stopAll()
		}

		$scope.gotoQuestion = function(index){

			if ($scope.isCurrentQuestion(index)){
				return false
			}

			if (!_.isNull($scope.currentIndex)){
				_onQuestionUnload($scope.currentIndex)
			}

			console.log('goto question: ', index)

			var question = _getQuestion(index)
			
			$scope.currentQuestion = question
			$scope.currentIndex = index

			if (!question.imageSeries){
				_loadImage(index, function(){
					_onQuestionLoad(index)
				})
			} else {
				_onQuestionLoad(index)
			}
		}

		$scope.isCurrentQuestion = function(index){

			return index === $scope.currentIndex
		}

		$scope.isLastQuestion = function(){

			return $scope.currentIndex === $scope.quiz.questions.length - 1
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

			_saveQuestionTime($scope.currentIndex)

			Timer.stopAll()

			$scope.quizResult.completed = true

			$scope.saveProgress(function(err){
				if (err){ return console.log(err) }

				$window.location.href = '/quiz/result/' + $scope.quizResult._id
			})
		}

		$scope.pause = function(){

			Timer.stopAll()

			$scope.questionPartial = partials.paused
			$scope.paused = true
		}

		$scope.resume = function(){

			$scope.questionPartial = partials.question
			$scope.paused = false

			Timer.startTimer($scope.currentIndex)
		}

		_init()


		/**
		 * test
		 */
		$scope.test = true
	}
])