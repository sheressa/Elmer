var Request = require('request-promise');
var WhenIWork = CONFIG.WhenIWork;
var options = {
  headers: {
    Authorization: KEYS.canvas.api_key,
    'User-Agent': 'Request-Promise',
  }
};
var canvas = {};

//finds all assignments in a specific canvas course
canvas.scrapeCanvasAssignments = function(courseID, filter){

  options.url = 'https://crisistextline.instructure.com/api/v1/courses/' + courseID + '/assignments?search_term=' + filter;

  return Request(options)
  .then(function(response){
    response = JSON.parse(response);
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME("Canvas call to get assignments for courseID " + courseID + " with the filter " + filter + " failed: ", err);
  });

};

//finds all canvas users with a specific name
canvas.scrapeCanvasUsers = function(name) {

  options.url = 'https://crisistextline.instructure.com/api/v1/accounts/1/users?search_term=' + name;

  return Request(options)
  .then(function(response){
    if (response === '[]') throw 'No user with that name found.';
    response = JSON.parse(response);
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Canvas call to get the user named ' + name + ' failed:', err);
  });

};

//finds all courses a specific user is enrolled in
canvas.scrapeCanvasEnrollment = function(userID) {

  options.url = 'https://crisistextline.instructure.com/api/v1/users/' + userID + '/enrollments';

  return Request(options)
  .then(function(response){
    response = JSON.parse(response);
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME("Finding courses for the user with ID " + userID + " in Canvas failed: ", err);
  });

};

canvas.updateUserGrade = function(user, course, assignment, grade) {
  //Gives the user a passing grade (check mark) in Canvas for the 'Schedule Your Shifts' assignment.
  var url = 'https://crisistextline.instructure.com/api/v1/courses/' + course + '/assignments/' + assignment + '/submissions/' + user;
  var updateOptions = {
    url: url,
    json: true,
    headers: {
      Authorization: KEYS.canvas.api_key
    },
    body: {
      submission: {posted_grade: grade}
    }
  };

  function callback(error, response, body){
    if(!error && response.statusCode == 200){
      console.log('Canvas update succeeded: ', body);
    } else {
      console.log("Canvas error message: ", response, response.statusCode);
    }
  }

  return Request.put(updateOptions, callback);

};

findWiWUserInCanvas = function(name, email) {
  //collects canvas user ID, courseID, and assignment ID based on the WiW
  //user ID, then calls the update grade function, which needs all three.
  var userID, courseID, assignmentID;

  canvas.scrapeCanvasUsers(name)
  .then(function(users) {
    users = users.filter(function(user) {
      //Note that here we are checking that both name and email match in
      //Canvas and WiW. This is pretty strict. In the future, we could make
      //it more tolerant depending on trainers' preferences. However, this
      //avoids conflicts where people have the same name but different emails.
      return user.login_id == email;
    });
    if (users.length === 0) throw 'No combination of that name and email was found in Canvas.';
    userID = users[0].id;
    return users[0].id;
  })
  .then(function(userID) {
    return canvas.scrapeCanvasEnrollment(userID);
  })
  .then(function(courses) {
    courses = courses.filter(function(course) {
      return course.enrollment_state == 'active';
    });
    if (courses.length === 0) throw 'No active courses for that user were found in Canvas.';
    courseID = courses[0].course_id;
    return courses[0].course_id;
  })
  .then(function(courseID) {
    return canvas.scrapeCanvasAssignments(courseID, 'Schedule Your Shifts');
  })
  .then(function(assignment) {
    if (assignment.length === 0) throw "No 'Schedule Your Shifts' assignment for that user was found in Canvas.";
    return canvas.updateUserGrade(userID, courseID, assignment[0].id, 'pass');
  })
  .catch(function(err) {
    CONSOLE_WITH_TIME("Finding the user " + name + " with email " + email + " in Canvas failed: ", err);
  });

};

// findWiWUserInCanvas("John Rauschenberg", 'john@crisistextline.org');

module.exports = {findWiWUserInCanvas: findWiWUserInCanvas, canvas: canvas};

