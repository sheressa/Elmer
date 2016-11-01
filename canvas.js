'use strict';
const canvas = {};
const fetch = require('requestretry');
/**
- requestretry library retries a maximum of 5 times (maxAttempts property on the options object)
- if we go over 5 tries per request we error out like we usually would
**/

// tells the requestretry library to retry the canvas call only when we hit the API call rate limit
function myRetryStrategy(err, response, body){
	if(!response) {
		CONSOLE_WITH_TIME(`Error from retry stratery! Empty response ${err}`);
		return false;
	}
	return response.statusCode===403;
}
// consolidates the options object
function createOptions(reqOptions){
	reqOptions.json =  true;
	reqOptions.retryStrategy = myRetryStrategy;
	reqOptions.headers = {
		Authorization: KEYS.canvas.api_key,
	};
	return reqOptions;

}
//finds all active canvas courses
canvas.getAllCourses = function(){
	const url = 'https://crisistextline.instructure.com/api/v1/accounts/1/courses?per_page=100';
	const options = createOptions({
		url: url
	});
	return fetch(options)
	.then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME(`Canvas call to get courses failed: ${err}`);
	})
}

//finds all assignments in a specific canvas course
canvas.getAssignments = function(courseID, searchTerm){
	var url = `https://crisistextline.instructure.com/api/v1/courses/${courseID}/assignments?per_page=100`;
	if(searchTerm) url = url+'&search_term='+searchTerm;
	const options = createOptions({
		url: url
	});

	return fetch(options)
	.then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME(`Canvas call to get assignments failed ${err}`);
	})

};

// returns an enrollment object for a user containing all active course id the user is enrolled in
canvas.getEnrollment = function(userID, enrollmentState){
 var url = `https://crisistextline.instructure.com/api/v1/users/${userID}/enrollments?per_page=100`;
 if(enrollmentState) url = url+'&state[]='+params;
 const options = createOptions({
		url: url
 });

	return fetch(options)
	.then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME(`Canvas call to get user enrollments failed ${err}`);
	});

};

//finds all enrollments in a given course
canvas.retrieveCourseEnrollment = function(courseID, enrollmentState) {

  const url = `https://crisistextline.instructure.com/api/v1/courses/${courseID}/enrollments?state[]=${enrollmentState}&per_page=100`;
  const options = createOptions({
		url: url
	});

  return fetch(options)
  .then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME(`Finding enrollments for the course with ID ${courseID} in Canvas failed: ${err}`);
  });

};

//finds all users in canvas if no params, if params finds users by name or email
canvas.getUsers = function(searchTerm){
	var url = 'https://crisistextline.instructure.com/api/v1/accounts/1/users?per_page=100';
	if(searchTerm) url = url+'&search_term='+searchTerm;
	const options = createOptions({
		url: url
	});

	return fetch(options)
	.then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME(`Canvas call to get users failed ${err}`);
	})
};

//updates a grade on canvas
canvas.updateUserGrade = function(userID, courseID, assignmentID, grade){
var url = `https://crisistextline.instructure.com/api/v1/courses/${courseID}/assignments/${assignmentID}/submissions/${userID}`;
 const options = createOptions({
   method: 'PUT',
   url: url,
   body: {submission:{posted_grade: grade}}
 });

  return fetch(options)
  .then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME(`Could not update grade ${err}`);
  });
};
canvas.submitAssignment = function(userID, courseID, assignmentID, submissionHTML) {
  //Submits assignment on users behalf
 const url = `https://crisistextline.instructure.com/api/v1/courses/${courseID}/assignments/${assignmentID}/submissions?as_user_id=${userID}`;
 const options = createOptions({
   method: 'PUT',
   url: url,
   body: {
      submission: {
        submission_type: 'online_text_entry',
        body: submissionHTML 
      }
    }
 });

  return fetch(options)
   .then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
  })
  .catch(function(err){
     CONSOLE_WITH_TIME(`Canvas submission failed for user ID ${userID}`);
     CONSOLE_WITH_TIME(`Canvas error message: ${err}`);
  });

};

canvas.deleteUser = function(userID) {
  const url = `https://crisistextline.instructure.com//api/v1/accounts/1/users/${userID}`;
  const options = createOptions({
  	method: 'DELETE',
		url: url
	});
  
  return fetch(options)
  .then(function(response) {
    return response.body;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME(`Deletion of Canvas user with ID ${userID} failed: ${err}`);
  });
};

canvas.getUserGrade = function(userID, courseID, assignmentID) {
  const url = `https://crisistextline.instructure.com/api/v1/courses/${courseID}/assignments/${assignmentID}/submissions/${userID}`;
  const options = createOptions({
		url: url
	});

  return fetch(options)
  .then(function(response) {
    return response.body.grade;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME(`Finding a grade for the user with ID ${userID} for assignment ${assignment} in course ${courseID} in Canvas failed: ${err}`);
  });

};

canvas.activateOrDeactivateEnrollment = function(courseID, enrollmentID, enrollmentType, userID) {
	const options = createOptions({});

  if (enrollmentType === 'reactivate') {
    options.url = `https://crisistextline.instructure.com/api/v1/courses/${courseID}/enrollments?enrollment[user_id]=${userID}&enrollment[type]=StudentEnrollment`;
    options.method = 'POST';
  }

  else if (enrollmentType === 'completed') {
    options.url = `https://crisistextline.instructure.com/api/v1/courses/${courseID}/enrollments/${enrollmentID}?task=conclude`;
    options.method = 'DELETE';
  }

  else if (enrollmentType === 'inactive') {
    options.url = `https://crisistextline.instructure.com/api/v1/courses/${courseID}/enrollments/${enrollmentID}?task=deactivate`;
    options.method = 'DELETE';
  }

  return fetch(options)
  .catch(function(err){
    CONSOLE_WITH_TIME(`Finding enrollments for the course with ID ${courseID} in Canvas failed: ${err}`);
  });

};

module.exports = canvas;