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

	hbs.registerHelper("length", function(array) {
		return array.length
	})

	hbs.registerHelper("correctAnswer", function(question) {

		var isNormal = question.questionId.normal
		if (_.isUndefined(isNormal)){ return "No correct answer found for this question" }
		return isNormal ? 'Normal' : 'Abnormal'
	})

	hbs.registerHelper("userAnswer", function(question) {

		if(question.userAnswerNormal){
			var userAnswer = question.userAnswerNormal
			return userAnswer ? 'Normal' : 'Abnormal'
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

	hbs.registerHelper('times', function(n, block) {
		var accum = ''
		for (var i = 0; i < n; ++i){
			accum += block.fn(i)
		}
		return accum
	});
}