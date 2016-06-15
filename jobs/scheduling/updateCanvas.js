function updateCanvas(user, course, assignment) {
  //Gives the user a passing grade (check mark) in Canvas for the schedule your first shift assignment.
  // var url = 'https://crisistextline.instructure.com/api/v1/courses/' + course + '/assignments/' + assignment + '/submissions/' + user;
  var url = 'https://crisistextline.instructure.com/api/v1/courses/courses/60/assignments/921/submissions/1734';
  var options = {
    url: url,
    headers: {
      Authorization: 'Bearer 7831~tMhSadI59TjBQeFQOAM7QsDg79F9FnDVEuez2O0EYHrs7QvhndHISiKFoxpFmvMu',
      submission: {posted_grade: 'fail'}
    }
  };

  function callback(error, response, body){
    if(!error && response.statusCode == 200){
      var info = bignumJSON.parse(body);
      console.log('CANVAS INFO ', info);
    } else {
      console.log("Canvas error message: ", body);
    }
  }
  Request.put(options, callback);

}