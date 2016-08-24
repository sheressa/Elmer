'use strict';

const request = require('request-promise');
const options = {
  headers: {
    Authorization: KEYS.canvas.api_key,
    'User-Agent': 'Request-Promise',
  }
};
const canvas = {};

//finds all assignments in a specific canvas course
canvas.scrapeCanvasAssignments = function(courseID, filter){

  options.url = 'https://crisistextline.instructure.com/api/v1/courses/' + courseID + '/assignments?search_term=' + filter;
  options.method = 'GET';

  return request(options)
  .then(function(response){
    response = JSON.parse(response);
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME("Canvas call to get assignments for courseID " + courseID + " with the filter " + filter + " failed: ", err);
  });

};

//finds all canvas users with a specific email address
canvas.scrapeCanvasUsers = function(email) {

  options.url = 'https://crisistextline.instructure.com/api/v1/accounts/1/users?search_term=' + email;
  options.method = 'GET';

  return request(options)
  .then(function(response){
    response = JSON.parse(response);
    if (email && Array.isArray(response) && response.length === 0) throw 'No user with the email  ' + email + ' found.';
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Canvas call to get the user with email ' + email + ' failed: ', err);
  });

};

//finds all canvas users
canvas.scrapeAllCanvasUsers = function() {

  return (function makeGetRequests(i = 1, fullResponse = [], stop = false) {
    if (stop === true) return fullResponse;

    let currentResponse = fullResponse;

    options.url = 'https://crisistextline.instructure.com/api/v1/accounts/1/users?page=' + i + '&per_page=100';
    options.method = 'GET';

    return request(options)
    .then(function(response){
      response = JSON.parse(response);
      if (response.length === 0) {
        stop = true;
      } else {
        currentResponse = currentResponse.concat(response);
      }
      return makeGetRequests(i + 1, currentResponse, stop);
    })
    .catch(function(err){
      CONSOLE_WITH_TIME('Canvas call to get all users failed: ', err);
    });
  })();

};

canvas.retrieveCourses = function() {

  options.url = 'https://crisistextline.instructure.com/api/v1/accounts/1/courses?state[]=available&per_page=100';
  options.method = 'GET';

  return request(options)
  .then(function(response){
    response = JSON.parse(response);
    if (Array.isArray(response) && response.length === 0) throw 'No courses found.';
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Canvas call to get courses failed: ', err);
  });

};

//finds all enrollments in a given course
canvas.retrieveEnrollment = function(courseID, enrollmentState) {

  options.url = 'https://crisistextline.instructure.com/api/v1/courses/' + courseID + '/enrollments?state[]=' + enrollmentState;
  options.method = 'GET';

  return request(options)
  .then(function(result){
    return result;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME("Finding enrollments for the course with ID " + courseID + " in Canvas failed: ", err);
  });

};

canvas.activateOrDeactivateEnrollment = function(courseID, enrollmentID, enrollmentType, userID) {

  if (enrollmentType === 'reactivate') {
    options.url = 'https://crisistextline.instructure.com/api/v1/courses/' + courseID + '/enrollments?enrollment[user_id]=' + userID + '&enrollment[type]=StudentEnrollment';
    options.method = 'POST';
  }

  else if (enrollmentType === 'completed') {
    options.url = 'https://crisistextline.instructure.com/api/v1/courses/' + courseID + '/enrollments/' + enrollmentID + '?task=conclude';
    options.method = 'DELETE';
  }

  else if (enrollmentType === 'inactive') {
    options.url = 'https://crisistextline.instructure.com/api/v1/courses/' + courseID + '/enrollments/' + enrollmentID + '?task=deactivate';
    options.method = 'DELETE';
  }

  return request(options)
  .catch(function(err){
    CONSOLE_WITH_TIME("Finding enrollments for the course with ID " + courseID + " in Canvas failed: ", err);
  });

};

//finds all courses a specific user is enrolled in, with optional enrollment states
canvas.scrapeCanvasEnrollment = function(userID, enrollmentState) {

  options.url = 'https://crisistextline.instructure.com/api/v1/users/' + userID + '/enrollments?state[]=' + enrollmentState;
  options.method = 'GET';

  return request(options)
  .then(function(result){
    result = JSON.parse(result);
    return result;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME("Finding courses for the user with ID " + userID + " in Canvas failed: ", err);
  });

};

canvas.deleteCanvasUser = function(userID) {
  options.url = 'https://crisistextline.instructure.com//api/v1/accounts/1/users/' + userID;
  return request.delete(options)
  .then(function(response) {
    response = JSON.parse(response);
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME("Deletion of Canvas user with ID " + userID + " failed: ", err);
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

  function callback(error, response){
    if(!error && response.statusCode === 200){
      CONSOLE_WITH_TIME(`Canvas grading succeeded for user ID ${user}`);
    } else {
      CONSOLE_WITH_TIME(`Canvas submission failed for user ID ${user}`);
      CONSOLE_WITH_TIME(`Canvas error message: ${response} ${response.statusCode}`);
    }
  }

  return request.put(updateOptions, callback);

};

canvas.getUserGrade = function(user, course, assignment) {
  var grade;
  options.url = 'https://crisistextline.instructure.com/api/v1/courses/' + course + '/assignments/' + assignment + '/submissions/' + user;
  options.method = 'GET';

  return request(options)
  .then(function(response) {
    response = JSON.parse(response);
    grade = response.grade;
    return grade;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME("Finding a grade for the user with ID " + user + " for assignment " + assignment + " in course " + course + " in Canvas failed: ", err);
  });

};

canvas.submitAssignment = function(user, course, assignment, submissionHTML) {
  //Submits assignment on users behalf
  var url = `https://crisistextline.instructure.com/api/v1/courses/${course}/assignments/${assignment}/submissions?as_user_id=${user}`;
  var updateOptions = {
    url: url,
    json: true,
    headers: {
      Authorization: KEYS.canvas.api_key
    },
    body: {
      submission: {
        submission_type: 'online_text_entry',
        body: submissionHTML 
      }
    }
  };

  function callback(error, response){
    if(!error && response.statusCode === 201){
      CONSOLE_WITH_TIME(`Canvas submission succeeded for user ID ${user}`);
    } else {
      CONSOLE_WITH_TIME(`Canvas submission failed for user ID ${user}`);
      CONSOLE_WITH_TIME(`Canvas error message: ${response} ${response.statusCode}`);
    }
  }

  return request.post(updateOptions, callback);

};

canvas.retrieveUserCourseAssignmentIds = function(userEmail, assignment, errFunc){
  let promiseUserID;
  let promiseCourseID;
  let promiseAssignmentID;

  // request canvas user with this email address and find their userId
  promiseUserID = canvas.scrapeCanvasUsers(userEmail)
    .then((users) => {
      if (users.length === 0) throw 'No user was found in Canvas for that email.';
      return users[0].id;
    }).catch(err => {
      const subject = `Error finding user with email ${userEmail} in Canvas`;
      errFunc(subject, err);
    });

  let userCanvasID; 
  // request courses and find correct courseId;
  promiseCourseID = promiseUserID
    .then((userID) => {
      userCanvasID = userID;
      return canvas.scrapeCanvasEnrollment(userID);
    })
    .then((courses) => {
      courses = courses.filter((course) => {
        return course.enrollment_state === 'active';
      });
      if (courses.length === 0) throw 'No active courses for user ${userCanvasID} were found in Canvas.';
      return courses[0].course_id;
    }).catch(err => {
      const subject = `Error finding active course for ${userEmail} in Canvas`;
      errFunc(subject, err);
    });

  // request assignments for course and find correct assignment
  promiseAssignmentID = promiseCourseID.then((courseID) => {
    return canvas.scrapeCanvasAssignments(courseID, assignment);
    })
    .then(assignments => {
      if (assignments.length === 0) throw `Canvas returned 0 assignments`;
      return assignments[0].id;
    }).catch(err => {
      const subject = `Error finding ${assignment} in course found for ${userEmail}`;
      errFunc(subject, err);
    });

  return Promise.all([promiseUserID, promiseCourseID, promiseAssignmentID]);
};

const findWiWUserInCanvas = function(email) {
  //collects canvas user ID, courseID, and assignment ID based on the WiW
  //user ID, then calls the update grade function, which needs all three.
  var userID;
  var courseID;
  var name;

  return canvas.scrapeCanvasUsers(email)
  .then(function(users) {
    if (users.length === 0) throw 'That email was not found in Canvas.';
    userID = users[0].id;
    name = users[0].name;
    email = users[0].login_id;
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
    return canvas.scrapeCanvasAssignments(courseID, CONFIG.canvas.assignments.scheduledShifts);
  })
  .then(function(assignment) {
    if (assignment.length === 0) throw "No 'Schedule Your Shifts' assignment for that user was found in Canvas.";
    return canvas.updateUserGrade(userID, courseID, assignment[0].id, 'pass');
  })
  .catch(function(err) {
    CONSOLE_WITH_TIME(`Finding the user with the email ${email} in Canvas failed: ${err}`);
  });

};

module.exports = {findWiWUserInCanvas: findWiWUserInCanvas, canvas: canvas};

