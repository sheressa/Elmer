$(document).ready(
	function(){
	    var max = 2;
	    var checkboxes = $('input[type="checkbox"]');

	    checkboxes.change(function(){
	        var current = checkboxes.filter(':checked').length;
	        checkboxes.filter(':not(:checked)').prop('disabled', current >= max);
	    });
	}
)