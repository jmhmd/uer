'use strict';

/* Controllers */

var quizApp = angular.module('quizApp.controllers', [])	
quizApp.controller('questionCtrl', ['$scope',
	function($scope) {

		// make linter happy
		//var quiz = quiz
		
		$scope.quiz = quiz

		$scope.currentIndex = 0

		$scope.currentQuestion = function(){

			console.log('current question is: ', $scope.currentIndex, $scope.quiz.questions[$scope.currentIndex])

			return $scope.quiz.questions[$scope.currentIndex]
		}

		$scope.gotoQuestion = function(index){

			console.log('goto question: ', index)

			if (!$scope.isCurrentQuestion(index)){

				$scope.currentIndex = index
			}
		}

		$scope.isCurrentQuestion = function(index){

			return index === $scope.currentIndex
		}
	}
])