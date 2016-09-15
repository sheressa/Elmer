'use strict';
const CronJob = require('cron').CronJob;
const internalRequest = require('request');
const fetch = require('node-fetch');
const KEYS = require('./keys.js');
// var SLACK_CHANNEL = '#melted';
// new CronJob(CONFIG.time_interval.graduate_users_cron_job_string, function () {
//     pollCanvasForGraduatedUsersThenCreatePlatformAccount();
//   }, null, true);

function go(){
	getStudentsFromCohort()
	.then(getEnrollmentsFromCohort)
	.catch(function(res){
		console.log('error', res)
	})
}


function getStudentsFromCohort(){
	return new Promise(function(resolve, reject){
		request(`accounts/${KEYS.canvas.accountID}/courses`, 'GET')
		  	.then(function (courses) {
	    		var previous;
		    	var cohorts = {};
		    	courses.forEach(function (course) {
					if (course.workflow_state!='available') return; 
					var cohortNumber = course.name.trim().split(' ')[1];
					if(isNaN(cohortNumber)) return;
					if(!cohorts[cohortNumber]){
						cohorts[cohortNumber] = [];
					}
					if(previous && previous === cohortNumber){
						cohorts[cohortNumber].push(course.id);
					}
					previous = cohortNumber;
				});
				resolve(cohorts);
			});
	});
}

function getEnrollmentsFromCohort(cohorts){
	return new Promise(function(resolve, reject){
		//iterate through cohorts object and create object for enrollment in each class
		var cohortEnrollments = Object.keys(cohorts).reduce(function(prev,curr){
			prev[curr] = {};
			prev[curr]['enrollment'] = null;
			return prev;
		}, {});
//Not working right because of Promise chain stuff. Rewrite 'enrollmentLengthAPICall' 
// and for loop using: http://stackoverflow.com/questions/24660096/correct-way-to-write-loops-for-promise

		//API call to get enrollment for each course (info for users)
		function enrollmentLengthAPICall(courseNum){
			return request(`courses/${courseNum}/enrollments`)
					.then(function(enrollment){
						console.log('Enrollment length: ', enrollment.length);
						return enrollment.length;
					});
		}

		//for each cohort, call API for enrollment and tally in 'courses' object
		for (var key in cohorts){
			if(!cohorts.hasOwnProperty(key)){
				continue;
			}
			var students = 0;
			for(var courseNumIter = 0; courseNumIter < cohorts[key].length; courseNumIter++){
				students += enrollmentLengthAPICall(cohorts[key][courseNumIter]);

			}
			cohortEnrollments[key].enrollment = students;
		}
		console.log(cohortEnrollments);
		resolve(cohortEnrollments);
	});
}

go();





//HELPER FUNCTIONS
function convertIds(text) {
  var regex = /":(\d+),/g;
  var id;
  var ids = [];

  text = text.replace(regex, function (match, id) {
    return '":"' + id + '",';
  });

  return new Promise(function (resolve, reject) {
    resolve(JSON.parse(text));
  });
}
// sets up basic api call functionality
function request(url, method, params) {
  if (!params) {
    params = [];
  }
  params.push('per_page=1000');

  url = 'https://crisistextline.instructure.com/api/v1/' + url;

  if (method == 'GET' && params && params.length > 0) {
    url = url + '?' + params.join('&');
  }

  return fetch(url, {
    headers: {
      'Authorization': KEYS.canvas.api_key,
    },
    method: method,
    body: params
  })
  .then(function (res) { return res.text(); })
  .then(convertIds);
}
