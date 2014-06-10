var _ = require('lodash')

exports.init = function(hbs){
	hbs.registerHelper("selected", function(selected, value, display) {
		if (!display){ display = value }
		var option = selected === value ? '<option value="'+value+'" selected>'+display+'</option>' : '<option value="'+value+'">'+display+'</option>'
		return new hbs.SafeString(option)
	})

	hbs.registerHelper("checked", function(value) {
		var rtn = value ? 'checked' : ''
		return rtn
	})

	hbs.registerHelper("math", function(lvalue, operator, rvalue) {
		lvalue = parseFloat(lvalue)
		rvalue = parseFloat(rvalue)

		return {
			"+": lvalue + rvalue,
			"-": lvalue - rvalue,
			"*": lvalue * rvalue,
			"/": lvalue / rvalue,
			"%": lvalue % rvalue
		}[operator]
	})

	hbs.registerHelper("correctAnswer", function(question, property) {

		var correctAnswer = _.find(question.questionId.choices, function(choice){ return choice.correct })
		if (!correctAnswer){ return "No correct answer found for this question" }
		return correctAnswer[property]
	})

	hbs.registerHelper("userAnswer", function(question, property) {

		if(question.userAnswer){
			var userAnswer = _.find(question.questionId.choices, function(choice){ return choice._id.equals(question.userAnswer) })
			return userAnswer[property]
		} else {
			return "No answer choice selected"
		}
	})

	hbs.registerHelper("questionTime", function(time) {

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

		return msToTime(time)
	})
}