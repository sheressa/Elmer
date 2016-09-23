'use strict';
const CronJob = require('cron').CronJob;
const internalRequest = require('request');
const fetch = require('node-fetch');
const KEYS = require('./keys.js');
// var SLACK_CHANNEL = '#melted';
// new CronJob(CONFIG.time_interval.graduate_users_cron_job_string, function () {
//     pollCanvasForGraduatedUsersThenCreatePlatformAccount();
//   }, null, true);
function masterConsoleTest(res){
	console.log(res);
	return res;
}
function go(){
	getStudentsFromCohort()
	.then(getEnrollmentsFromCohort)
	.then(getTotalAcceptedIntoTraining)
	.then(getGradAndFirstShiftCheckpointIDsForEachCohort)
	.then(masterConsoleTest)
	//.then(getUserEmailsForEachCohort)
	//.then(infoFromEmail)
	.catch(function(err){
		console.error('Error: ', err)
	})
}

function getStudentsFromCohort(){
	return new Promise(function(resolve, reject){
		request(`accounts/${KEYS.canvas.accountID}/courses?per_page=1000&enrollment_type[]=student`, 'Canvas', 'GET')
		  	.then(function (courses) {
	    		var previous;
		    	var cohorts = {};
		    	courses.forEach(function (course) {
					if (course.workflow_state!='available') return; 
					//**parses cohortNumber from 'course name'. regex may be better
					//if cohort naming changes format, the entire Cronjob will break
					//maybe look for better methods for retrieving cohort number
					var nameArr = course.name.trim().split(' ');
					var cohortNumber = nameArr[1];
					if(isNaN(cohortNumber)) return;
					if(!cohorts[cohortNumber]){
						cohorts[cohortNumber] = {};
						cohorts[cohortNumber].class_ids = [];
						cohorts[cohortNumber].trainers = [];
					}
					cohorts[cohortNumber].class_ids.push(course.id);
					//***pulls trainer name from course name. Should it pull trainer user id? 
					//temporary, each cohort has multiple trainers for each class. Need to change this
					var trainer = nameArr[nameArr.length -1]
					if(cohorts[cohortNumber].trainers.indexOf(trainer) < 0){
						cohorts[cohortNumber].trainers.push(trainer);
		    		}
				});
				resolve(cohorts);
			})
			.catch(errorHandler);
	})
		.catch(errorHandler);
}

function getEnrollmentsFromCohort(cohorts){
	return new Promise(function(resolve, reject){
		//iterate through cohorts object and create object for enrollment in each class
		var cohortEnrollments = Object.keys(cohorts).reduce(function(prev,curr){
			prev[curr] = {};
			prev[curr]['enrolled_into_canvas'] = null;
			return prev;
		}, {});
		function enrollmentLengthAPICall(courseNum){
			return request(`courses/${courseNum}/enrollments?per_page=1000&enrollment_type[]=student&state[]=active&state[]=completed&state[]=inactive`, 'Canvas', 'GET')
					.then(function(enrollment){
						return enrollment.length;
					})
					.catch(errorHandler);
		}
		//for each cohort, call API for enrollment and tally in 'cohortEnrollments' object
		var sumTallyPromiseArray = [];	
		for (var key in cohorts){
			if(!cohorts.hasOwnProperty(key)){
				continue;
			}
			var classes = cohorts[key].class_ids;
			var classAPICalls = Promise.all(classes.map(enrollmentLengthAPICall));
			var sumTallyPromise = classAPICalls
				.then(function(data){
					return data.reduce(function(a,b){ return a+b;}, 0);
				})
				.catch(errorHandler);
			cohortEnrollments[key] = sumTallyPromise;
			sumTallyPromiseArray.push(sumTallyPromise);
		}
		//wait for class enrollment API calls and enrollment tallies, then put into output object
		Promise.all(sumTallyPromiseArray)
			.then(function(res){
				Object.keys(cohortEnrollments).forEach(function(key){
					cohortEnrollments[key].then(function(val){
						cohorts[key]['enrolled_into_canvas'] = val;
					});
				});
				resolve(cohorts);
			})
			.catch(errorHandler);
	});
}

function getTotalAcceptedIntoTraining(cohorts){
	return new Promise(function(resolve, reject){
		var cohortAcceptance = Object.keys(cohorts).reduce(function(prev,curr){
			prev[curr] = {};
			prev[curr]['accepted_into_training'] = null;
			return prev;
		}, {});
	
		function acceptanceAPICall(cohortNum){
			//CTL online only returns 20 users per request, need parameter to return more
			return request(`parameters[field_cohort]=${cohortNum}&per_page=1000`, 'CTL', 'GET')
					.then(function(acceptance){
						// if(cohortNum == 19){
						// 	console.log(acceptance);
						// }
						return acceptance.length;
					})
					.catch(errorHandler);
		}
		var tallyPromiseArray = [];	
		for (var key in cohorts){
			if(!cohorts.hasOwnProperty(key)){
				continue;
			}
			cohortAcceptance[key] = acceptanceAPICall(key)
			tallyPromiseArray.push(cohortAcceptance[key]);
		}
		//wait for class enrollment API calls and enrollment tallies, then put into output object
		Promise.all(tallyPromiseArray)
			.then(function(res){
				Object.keys(cohortAcceptance).forEach(function(key){
					cohortAcceptance[key].then(function(val){
						cohorts[key]['accepted_into_training'] = val;
					});
				});
				resolve(cohorts);
			})
			.catch(errorHandler);
	});
}

function getGradAndFirstShiftCheckpointIDsForEachCohort(cohorts){
	return new Promise(function(resolve,reject){
		var cohortKeys = Object.keys(cohorts);
		var gradClassIDs = cohortKeys.reduce(function(prev,curr){
			prev[curr] = {};
			prev[curr]['graduate_checkpoint_ids'] = [];
			prev[curr]['promises'] = null;
			prev[curr]['first_shift_checkpoint_ids'] = [];
			return prev;
		},{});
		function gradCheckPointIDAPICall(classID){
			return request(`courses/${classID}/assignments?per_page=1000`, 'Canvas', 'GET')
				.then(function(assignments){
					
					var gradAssignmentID = assignments.filter(function(assignment){
						let regex = /platform ready/;
						return assignment.name.toLowerCase().match(regex);
					})[0].id;
					var firstShiftAssignmentID = assignments.filter(function(assignment){
						let regex1 = /attend first shift/;
						let regex2 = /attend shifts 1\+2/;
						return assignment.name.toLowerCase().match(regex1) || assignment.name.toLowerCase().match(regex2);
					})[0].id;
					
		
					return { 
								gradID: gradAssignmentID,
								firstShiftID: firstShiftAssignmentID
							};
				})
				.catch(errorHandler);
		}
		var idPromiseCollector = [];
		cohortKeys.forEach(function(key){
			var classIDs = cohorts[key].class_ids;
			var apiCallPromises = classIDs.map(gradCheckPointIDAPICall);
			idPromiseCollector.push(apiCallPromises);
			gradClassIDs[key].promises = apiCallPromises;
		});

		Promise.all(idPromiseCollector.reduce(function(prev,curr){
			return prev.concat(curr);
		}))
			.then(function(res){
				//push assignment ids from 'gradClassIDs[cohortnum].promises' to 'gradClassIDs[cohortnum].graduate_checkpoint_ids' and 'gradClassIDs[cohortnum].first_shift_checkpoint_ids'
				var collectorForClassIDPromisesInEachCohort = [];
				cohortKeys.forEach(function(key){
					gradClassIDs[key].promises.forEach(function(prom){
						var promiseToResolveCourseCheckpointIDs = prom.then(function(checkpointIDs){
							gradClassIDs[key].graduate_checkpoint_ids.push(checkpointIDs.gradID);
							gradClassIDs[key].first_shift_checkpoint_ids.push(checkpointIDs.firstShiftID);
						
						});
						collectorForClassIDPromisesInEachCohort.push(promiseToResolveCourseCheckpointIDs);
					});
				});
				console.log(collectorForClassIDPromisesInEachCohort);

				Promise.all(collectorForClassIDPromisesInEachCohort)
					.then(function(res){
						cohortKeys.forEach(function(key){
							cohorts[key].graduate_checkpoint_ids = gradClassIDs[key].graduate_checkpoint_ids;
							cohorts[key].first_shift_checkpoint_ids = gradClassIDs[key].first_shift_checkpoint_ids;
						});
						resolve(cohorts);
					}).catch(errorHandler);
			}).catch(errorHandler);
			//after that, take all these id's and check to see if users graduated and started their first shift
	});
}

function getTotalUsersWhoTookFirstShift(cohorts){

}

// function getUserIDsForEachCohort(cohorts){
// 	return new Promise(function(resolve, reject){
// 		var cohortKeys = Object.keys(cohorts);
// 		var cohortEmails = {};
// 		var cohortPromises = {};
// 		var allPromises =[];
// 		cohortKeys.forEach(function(key){
// 			var classes = cohorts[key].class_ids;
// 			cohorts[key].emails = [];
// 			cohortPromises[key] = classes.map(function(class_id){
// 					return request(`courses/${class_id}/users?per_page=1000&enrollment_type[]=student`, 'GET')
// 						.then(function(users){
// 							return users.map(function(user){
// 								return user.login_id;
// 							});
// 						});
// 			});
// 			allPromises.push(cohortPromises[key]);
// 		});
// 		allPromises = allPromises.reduce(function(prev,curr){
// 			return prev.concat(curr);
// 		});
// 		var finalPromiseCheck = Promise.all(allPromises);
// 		finalPromiseCheck
// 			.then(function(res){
// 				var promiseCheck = [];
// 				cohortKeys.forEach(function(key){
// 					cohortPromises[key].forEach(function(cohortP){
// 						var emailResolvePromise = cohortP.then(function(userEmails){
// 							cohorts[key].emails.push(userEmails);
// 						});
// 						promiseCheck.push(emailResolvePromise);
// 					});
// 				});

// 				Promise.all(promiseCheck)
// 					.then(function(res){
// 						cohortKeys.forEach(function(key){
// 							cohorts[key].emails = cohorts[key].emails.reduce(function(prev,curr){
// 								return prev.concat(curr);
// 							});
// 						});
// 						resolve(cohorts);
// 					});
// 			});
// 	});
// }

// function infoFromEmail(cohorts){
// 	return new Promise(function(resolve, reject){
// 		var cohortEmails = {};
// 		var cohortKeys = Object.keys(cohorts);
// 		cohortKeys.forEach(function(key){
// 			cohortEmails[key] = cohorts[key].emails;
// 		});
// 		console.log(cohortEmails);
// 	});
// }
// function testFunction(){
// 	return new Promise(function(resolve, reject){
// 		request('courses/75/users?per_page=1000', 'GET')
// 			.then(function(users){
// 				console.log('Test Users: ', users.length);
// 				users.forEach(function(user){
// 					console.log(user.name);
// 				});
// 			});
// 	});
// }

//wrap in Cronjob
go();
// testFunction();

//HELPER FUNCTIONS
function errorHandler(err){
	console.error('Error: ', err);
}

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
function request(url, API, method, params) {
  if (!params) {
    params = [];
  }
  //params.push('per_page=1000');
  if(API === 'Canvas'){
  	url = 'https://crisistextline.instructure.com/api/v1/' + url;
  } else if (API === 'CTL'){
  	url = `https://online.crisistextline.org/api/v1/entity_user?api-key=${KEYS.CTLOnline.api_key}&` + url;
  }
  
  if (method == 'GET' && params && params.length > 0) {
  	if(API === 'Canvas'){
  		url = url + '?';
  	}
    url = url + params.join('&');
  }
  var fetchData = {
  	method: method,
  	body: params
  }

  if(API == 'Canvas'){
  	fetchData['headers'] = {'Authorization': KEYS.canvas.api_key};
  }
  // console.log("Request url: ", url);

  return fetch(url, fetchData)
  .then(function (res) { return res.text(); })
  .then(convertIds);
}
