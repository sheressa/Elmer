'use strict';
const CronJob = require('cron').CronJob;
const internalRequest = require('request');
const fetch = require('node-fetch');
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
			var courseNameStringNumber = parseInt(course.name.split(' ')[1]);
			if(!cohorts[courseNameStringNumber]){
				cohorts[courseNameStringNumber] = [];
			}
			if(previous && previous === courseNameStringNumber){
				cohorts[courseNameStringNumber].push(course.id);
			}
			previous = courseNameStringNumber;
		});
		resolve(cohorts);
	});
});
}

function getEnrollmentsFromCohort(cohorts){
	return new Promise(function(resolve, reject){

		var keys = Object.keys(cohorts);
		var students = 0;
		var cohortData = {};
		keys.forEach(function(key){
			cohortData.key = {ids: };
			cohorts[key].forEach(function(course){
				// make enrollement call
				// call length on response 
				// add it to students
				request(`accounts/${KEYS.canvas.accountID}/
					enrollments/${course}`)
					.then(function(enrollment){
						var len = enrollment.length;

						students += len;
					})
			})
			// array acc
			// students=0;
		})
		
	});
}







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