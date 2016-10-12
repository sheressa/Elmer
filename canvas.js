'use strict';
const canvas = {};
const fetch = require('requestretry');
/**
- requestretry library retries a maximum of 5 times (maxAttempts property on the options object)
- if we go over 5 tries per request we error out like we usually would
**/

// tells the requestretry library to retry the canvas call only when we hit the API call rate limit
function myRetryStrategy(err, response, body){
	return response.statusCode===403;
}
//finds all active canvas courses
canvas.scrapeCanvasC = function(){

	var url = 'https://crisistextline.instructure.com/api/v1/accounts/1/courses?per_page=100';
		var options = {
		url: url,
		json: true,
		retryStrategy: myRetryStrategy,
		headers: {
			Authorization: KEYS.canvas.api_key,
		}
	};
	return fetch(options)
	.then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get courses failed: ', err)
	})
}

//finds all assignments in a specific canvas course
canvas.scrapeCanvasA = function(id, params){

	var url = 'https://crisistextline.instructure.com/api/v1/courses/'+id+'/assignments?per_page=100';
	if(params) url = url+'&search_term='+params.search_term;
	var options = {
		url: url,
		json: true,
		retryStrategy: myRetryStrategy,
		headers: {
			Authorization: KEYS.canvas.api_key,
		}
	};

	return fetch(options)
	.then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get assignments failed', err)
	})

};

// returns an enrollment object for a user containing all active course id the user is enrolled in
canvas.scrapeCanvasEnroll = function(url){

	var options = {
		url: url,
		json: true,
		retryStrategy: myRetryStrategy,
		headers: {
			Authorization: KEYS.canvas.api_key,
		}
	};

	return fetch(options)
	.then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get user enrollments failed', err)
	});

};

//finds all users in a specific canvas course
canvas.scrapeCanvasU = function(url, params){
		var options = {
			url: url,
			qs: {search_term:params.search_term},
			json: true,
			retryStrategy: myRetryStrategy,
			headers: {
				Authorization: KEYS.canvas.api_key,
			}
		};

		return fetch(options)
		.then(function(response){
			if(response.statusCode!==200) throw response.message;
			return response.body;
		})
		.catch(function(err){
			CONSOLE_WITH_TIME('Canvas call to get users failed', err);
		})
};

//updates a grade on canvas
canvas.updateGradeCanvas = function(cID, aID, uID, grade){
var url = 'https://crisistextline.instructure.com/api/v1/courses/'+cID+'/assignments/'+aID+'/submissions/'+uID;
 var options = {
   method: 'PUT',
   url: url,
   json: true,
   retryStrategy: myRetryStrategy,
   headers: {
     Authorization: KEYS.canvas.api_key,
   }, 
   body: {submission:{posted_grade: grade}}
 };

  return fetch(options)
  .then(function(response){
		if(response.statusCode!==200) throw response.message;
		return response.body;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Could not update grade', err);
  });
};

module.exports = canvas;