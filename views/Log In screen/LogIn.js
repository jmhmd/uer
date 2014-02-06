










/*  This Code may be needed since the placeholder attribute is not supported by all browsers.  
	This first piece checks for support on their browser.

		function hasPlaceholderSupport() {
		var input = document.createElement('input');
		return ('placeholder' in input);
		}

	If it is not supported this backup code will be needed.
	
		$("input:text").each(function(){
    		// store default value
    		var v = this.value;
		$(this).blur(function(){
        	// if input is empty, reset value to default 
        if (this.value.length == 0) this.value = v;
    	}).focus(function(){
        	// when input is focused, clear its contents
        this.value = "";
    		}); 
		});

	Alternatively, directly placing these html attributes can achieve similar effects, but does not allow for trial of placeholder first.

		<input...........value="email@gmail.com" onblur="if (this.value == '') {this.value = 'email@gmail.com';}"
 		onfocus="if (this.value == 'email@gmail.com') {this.value = '';}"/>
 */

