var maxCheckedBoxes = 2; // Only two boxes can be checked at a given time. Restricting because of perceived WhenIWork API limits.
var checkboxes = $('input[type="checkbox"]');

checkboxes.change(function(){
    var currentBoxesChecked = checkboxes.filter(':checked').length;
    checkboxes.filter(':not(:checked)').prop('disabled', currentBoxesChecked >= maxCheckedBoxes);
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
