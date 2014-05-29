'use strict';

/* Select point on image directive */

var quizApp = angular.module('quizApp.timer', [])	
quizApp.factory('Timer', [
	function() {

		var sessionStart = moment(),
			timedObjects = []

		function TimedObject (id){

			return {
				id: id,
				created: moment(),
				timerStart: false, // set to date when timer is active
				timeElapsed: 0, // in ms
				getElapsed: function(){
					return this.timerStart ? this.timeElapsed + moment().diff(this.timerStart, 'milliseconds') : this.timeElapsed
				},
				startTimer: function(){
					this.timerStart = moment()
				},
				stopTimer: function(){
					this.timeElapsed += moment().diff(this.timerStart, 'milliseconds')
					this.timerStart = false
				}
			}
		}

		function createTimedObject (id){

			// create new object
			var timedObject = new TimedObject(id)

			// add to collection
			timedObjects.push(timedObject)

			return timedObject
		}

		function stopAll (){

			// set all as inactive
			_.each(timedObjects, function(timedObject){
				if (timedObject.timerStart){
					timedObject.stopTimer()
				}
			})
		}

		function startTimer (id){

			stopAll()

			// find correct timed object
			var timedObject = _.find(timedObjects, {id: id})

			timedObject.startTimer()
		}

		function getActiveId (){

			var running = _.reject(timedObjects, {timerStart: false})

			if (running.length > 1){
				console.error("Shouldn't have more than one running timer")
			} else if (running.length === 0){
				return false
			} else {
				return running[0]
			}
		}

		function isTimedObject (id){
			return _.find(timedObjects, {id: id}) ? true : false
		}

		function getTotalElapsed (){

			// add up elapsed time for each timer
			var totalElapsed = _.reduce(timedObjects, function(sum, obj){
				return sum + obj.getElapsed()
			}, 0)

			return totalElapsed
		}

		function msToTime (s) {
			function addZ(n) {
				return (n < 10 ? '0' : '') + n;
			}

			var ms = s % 1000;
			s = (s - ms) / 1000;
			var secs = s % 60;
			s = (s - secs) / 60;
			var mins = s % 60;
			var hrs = (s - mins) / 60;

			return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) // + '.' + ms;
		}

		function getObjectElapsed (id){
			return _.find(timedObjects, {id: id}).getElapsed()
		}
		
		return {
			isTimedObject: isTimedObject,
			createTimedObject: createTimedObject,
			startTimer: startTimer,
			stopAll: stopAll,
			getTotalElapsed: getTotalElapsed,
			getObjectElapsed: getObjectElapsed,
			msToTime: msToTime
		}
	}
])