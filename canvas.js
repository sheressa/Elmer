var Request = require('request-promise');
var bignumJSON = require('json-bignum');
global.KEYS = require('./keys.js');
// var throttler = require('throttled-request')(Request);

var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 250);

var canvas = {};


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
		// console.log('These are the courses ', info);
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
		console.log('These are the assignments ', info);
		return info;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get assignments failed: ', err)
	})

};

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
		console.log('These are the enrollements ', info);
		return info;
	})
	.catch(function(err){
		CONSOLE_WITH_TIME('Canvas call to get users failed: ', err)
	});

};


//finds all users in a specific canvas course
	canvas.scrapeCanvasU = function(url, params){

		// var url = 'https://crisistextline.instructure.com/api/v1/courses/'+cID+'/users?per_page=1000';
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
			// console.log('These are the users ', info);
			return info;
		})
		.catch(function(err){
			CONSOLE_WITH_TIME('Canvas call to get users failed: ', err)
		})

};

module.exports = canvas;