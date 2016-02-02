var max = 2;
var checkboxes = $('input[type="checkbox"]');

checkboxes.change(function(){
    var current = checkboxes.filter(':checked').length;
    checkboxes.filter(':not(:checked)').prop('disabled', current >= max);
});

$("#delete-shifts").click(function(e){
    e.preventDefault();

    var deleteURL = "/scheduling/shifts?" + $("form[name=cancel-form]").serialize();

    $.ajax({
        url: deleteURL,
        type: "DELETE",
        success: function(data) {
            window.location = data.redirect;
        }
    });
});
