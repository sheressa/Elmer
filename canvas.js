const Request = require('request-promise');
const bignumJSON = require('json-bignum');
const canvas = {};
const fetch = require('fetch-retry');

//finds all active canvas courses
canvas.scrapeCanvasC = function(){

	var url = 'https://crisistextline.instructure.com/api/v1/accounts/1/courses?per_page=1000';
		var options = {
		url: url,
		headers: {
			Authorization: KEYS.canvas.api_key,
			'User-Agent': 'Request-Promise'
		}
	};
	return Request(options)
	.then(function(response){
		var info = bignumJSON.parse(response);
		return info;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get courses failed: ', err)
	})
}

//finds all assignments in a specific canvas course
canvas.scrapeCanvasA = function(id, params){

	var url = 'https://crisistextline.instructure.com/api/v1/courses/'+id+'/assignments';
	if(params) url = url+'?search_term='+params.search_term+'&per_page=100';
	var options = {
		headers: {
			Authorization: KEYS.canvas.api_key,
		}
	};

	return fetch(url, options)
	.then(function(response){
		return response.json();
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get assignments failed')
	})

};

// returns an enrollment object for a user containing all active course id the user is enrolled in
canvas.scrapeCanvasEnroll = function(url){

	var options = {
		headers: {
			Authorization: KEYS.canvas.api_key,
		}
	};

	return fetch(url, options)
	.then(function(response){
		return response.json();
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get users failed')
	});

};

//finds all users in a specific canvas course
canvas.scrapeCanvasU = function(url, params){
		url = url+'?search_term='+params.search_term;
		var options = {
			headers: {
				Authorization: KEYS.canvas.api_key,
			}
		};

		return fetch(url, options)
		.then(function(response){
			return response.json();
		})
		.catch(function(){
			CONSOLE_WITH_TIME('Canvas call to get users failed');
		})
};

//updates a grade on canvas
canvas.updateGradeCanvas = function(cID, aID, uID, grade){

var url = 'https://crisistextline.instructure.com/api/v1/courses/'+cID+'/assignments/'+aID+'/submissions/'+uID;
 var options = {
   method: 'PUT',
   headers: {
     Authorization: KEYS.canvas.api_key,
   }, 
   payload: {submission:{posted_grade: grade}}
 };

  return fetch(url, options)
  .then(function(response){
    return  response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Could not update grade');
  });
};

module.exports = canvas;