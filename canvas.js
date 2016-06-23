var Request = require('request-promise');
var bignumJSON = require('json-bignum');
var canvas = {};

//@TODO: add error handling

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
	var options = {
		url: url,
		headers: {
			Authorization: KEYS.canvas.api_key,
			'User-Agent': 'Request-Promise'
		}
	};

	if(params) options.qs = params;

	return Request(options)
	.then(function(response){
		var info = bignumJSON.parse(response);
		return info;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get assignments failed: ', err)
	})

};

// returns an enrollment object for a user containing all active course id the user is enrolled in
canvas.scrapeCanvasEnroll = function(url){

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
		CONSOLE_WITH_TIME('Canvas call to get users failed: ', err)
	});

};

//finds all users in a specific canvas course
canvas.scrapeCanvasU = function(url, params){

		var options = {
			url: url,
			headers: {
				Authorization: KEYS.canvas.api_key,
				'User-Agent': 'Request-Promise'
			}
		};

		if (params) options.qs=params;

		return Request(options)
		.then(function(response){
			var info = bignumJSON.parse(response);
			return info;
		})
		.catch(function(err){
			CONSOLE_WITH_TIME('Canvas call to get users failed: ', err, options)
		})
};

//updates a grade on canvas
canvas.updateGradeCanvas = function(cID, aID, uID, grade){

var url = 'https://crisistextline.instructure.com/api/v1/courses/'+cID+'/assignments/'+aID+'/submissions/'+uID;
 var options = {
   method: 'PUT',
   url: url,
   headers: {
     Authorization: KEYS.canvas.api_key,
     'User-Agent': 'Request-Promise'
   }, 
   json: true,
   body: {submission:{posted_grade: grade}}
 };

  return Request(options)
  .then(function(response){
    return  response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Could not update grade: ', err)
  });
};

module.exports = canvas;