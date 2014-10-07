'use strict';

/* Controllers */

var quizApp = angular.module('prepostQuiz', [])	
quizApp.controller('formCtrl', ['$scope', '$http', '$window',
	function($scope, $http, $window) {

		// passed in through handlebars template
		// var quiz = quiz,
		// 	quizResult = quizResult,
		// 	section = section
		
		$scope.quiz = quiz
		$scope.quizResult = quizResult
		$scope.section = section
		$scope.questionPartial = '/html/quiz.prepost.html'

		if ($scope.section === 'pre'){
			$scope.questions = $scope.quiz.preQuestions
			$scope.result = $scope.quizResult.preQuestions
		} else if ($scope.section === 'post'){
			$scope.questions = $scope.quiz.postQuestions
			$scope.result = $scope.quizResult.postQuestions
		}

		var _init = function(){

			

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

			// make sure all required questions are completed
			var reqError = _.find($scope.result, function(question, i){
					return $scope.questions[i].answerRequired && !question.userAnswer && !question.freeTextAnswer
				})
			if (reqError){
				window.alert('Please complete all required questions')
				return false
			}

			if(!window.confirm('Are you sure? Once you submit you cannot go back and change answers.')){
				return false
			}

			if ($scope.section === 'pre'){
				$scope.quizResult.preQuestionsCompleted = true
			} else if ($scope.section === 'post'){
				$scope.quizResult.postQuestionsCompleted = true
			}

			$scope.saveProgress(function(err){
				if (err){ return console.log(err) }

				$window.location.reload()
			})
		}

		_init()

	}
])