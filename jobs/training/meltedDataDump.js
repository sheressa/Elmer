'use strict';
const CronJob = require('cron').CronJob;
const internalRequest = require('request');
const fetch = require('node-fetch');
const KEYS = require('./keys.js');
const fs = require('fs');
const APICallsPerSecond = 10;
var SLACK_CHANNEL = '#melted';
// new CronJob(CONFIG.time_interval.graduate_users_cron_job_string, function () {
//     pollCanvasForGraduatedUsersThenCreatePlatformAccount();
//   }, null, true);
function masterConsoleTest(res){
	console.log(res);
	return res;
}
function go(){
	return getCohortNumbers()
		.then(getEnrollmentsFromCohort)
		.then(getTotalAcceptedIntoTraining)
		.then(getGradAndFirstShiftCheckpointIDsForEachCohort) 
		.then(getTotalUsersWhoTookFirstShiftAndGraduated)	
		.then(masterConsoleTest)
		//.then(notifySlack)
		.catch(function(err){
			console.error('Error: ', err)
			return err;
		});
}

function getCohortNumbers(){
	return new Promise(function(resolve, reject){
		console.log('Getting cohorts from Canvas');
		var start = Date.now();
		request(`accounts/${KEYS.canvas.accountID}/courses?per_page=1000&enrollment_type[]=student`, 'Canvas', 'GET')
		  	.then(function (courses) {
	    		var previous;
		    	var cohorts = {};
		    	courses.forEach(function (course) {
					//if (course.workflow_state!='available') return; 
					//**parses cohortNumber from 'course name'. regex may be better
					//if cohort naming changes format, cohort numbers will be incorrect
					//maybe look for better methods for retrieving cohort number
					var nameArr = course.name.trim().split(' ');
					var cohortNumber = nameArr[1];
					if(isNaN(cohortNumber) || nameArr[0].toLowerCase() !== 'cohort') return;
					if(!cohorts[cohortNumber]){
						cohorts[cohortNumber] = {};
						
						cohorts[cohortNumber].class_ids = [];
						cohorts[cohortNumber].closed_class_ids = [];
						// cohorts[cohortNumber].trainers = [];
					}
					if(course.workflow_state==='available'){
						cohorts[cohortNumber].class_ids.push(course.id);
					} else if(course.workflow_state==='completed'){
						cohorts[cohortNumber].closed_class_ids.push(course.id);
					}
					
				});
				var cohortKeys = Object.keys(cohorts);
				cohortKeys.forEach(function(key){
					if(cohorts[key].class_ids.length == 0) delete cohorts[key];
				});
				var timeTook = (Date.now()-start)/1000;
				console.log(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			}).catch(errorHandler);
	}).catch(errorHandler);
}

function getEnrollmentsFromCohort(cohorts){
	return new Promise(function(resolve, reject){
		//iterate through cohorts object and create object for enrollment in each class
		var start = Date.now();
		console.log('Getting enrolled students...');
		var cohortEnrollments = Object.keys(cohorts).reduce(function(prev,curr){
			prev[curr] = {};
			prev[curr].enrolled_into_canvas = [];
			return prev;
		}, {});
		function enrollmentLengthAPICall(courseNum){
			var enrolled = 0;
			var pageNumber = 1;
			function recursiveRequestCaller(){
				return request(`courses/${courseNum}/enrollments?per_page=1000&page=${pageNumber}&enrollment_type[]=student&state[]=active&state[]=completed&state[]=inactive`, 'Canvas', 'GET')
						.then(function(enrollment){
							if(enrollment.length == 0){
								return enrolled;
							}
							enrolled += enrollment.length;
							pageNumber += 1;
							return recursiveRequestCaller();
						}).catch(errorHandler);
			}
			return recursiveRequestCaller();
		}
		//for each cohort, call API for enrollment and tally in 'cohortEnrollments' object
		var sumTallyPromiseArray = [];	
		for (var key in cohorts){
			if(!cohorts.hasOwnProperty(key)){
				continue;
			}

			var classes = cohorts[key].class_ids.concat(cohorts[key].closed_class_ids);
			var classAPICalls = Promise.all(classes.map(enrollmentLengthAPICall));
			var sumTallyPromise = classAPICalls
				.then(function(data){
					return data.reduce(function(a,b){ return a+b; }, 0);
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
						cohorts[key].enrolled_in_canvas = val;
					});
				});
				var timeTook = (Date.now()-start)/1000;
				console.log(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			}).catch(errorHandler);
	}).catch(errorHandler);
}

function getTotalAcceptedIntoTraining(cohorts){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		console.log('Getting total number accepted into training (takes a few seconds)...');
		var tallyPromiseArray = [];	
		function acceptanceAPICall(cohortNum){
			//CTL online only returns 20 users per request, recursively gets data from each page
			var accepted = 0;
			var pageNumber = 1;
			function recursiveRequestCaller(){
				return request(`parameters[field_cohort]=${cohortNum}&page=${pageNumber}`, 'CTL', 'GET')
					.then(function(acceptance){
						if(acceptance[0] === 'No entities found.'){
							cohorts[cohortNum].accepted_into_training = accepted;
							return accepted;
						}
						accepted += acceptance.length;
						pageNumber += 1;
						return recursiveRequestCaller();
					}).catch(errorHandler);
			};
			return recursiveRequestCaller();
		}
		
		for (var key in cohorts){
			if(!cohorts.hasOwnProperty(key)){
				continue;
			}
			tallyPromiseArray.push(acceptanceAPICall(key));
		}
		//wait for class enrollment API calls and enrollment tallies, then put into output object
		Promise.all(tallyPromiseArray)
			.then(function(res){
				var timeTook = (Date.now()-start)/1000;
				console.log(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			})
			.catch(errorHandler);
	});
}
//obtains the ids for the graduation and first shift checkpoints
function getGradAndFirstShiftCheckpointIDsForEachCohort(cohorts){
	return new Promise(function(resolve,reject){
		var start = Date.now();
		console.log('Obtaining info on grads and people who started first shift...');
		var cohortKeys = Object.keys(cohorts);
		var gradClassIDs = cohortKeys.reduce(function(prev,curr){
			prev[curr] = {};
			prev[curr].graduate_checkpoint_ids = [];
			prev[curr].promises = null;
			prev[curr].first_shift_checkpoint_ids = [];
			return prev;
		},{});
		function gradCheckPointIDAPICall(classID){
			return request(`courses/${classID}/assignments?per_page=1000`, 'Canvas', 'GET')
				.then(function(assignments){
					var gradAssignmentID = assignments.filter(function(assignment){
						let regex1 = /platform ready/;
						let regex2 = /graduation/;
						return assignment.name.toLowerCase().match(regex1) || assignment.name.toLowerCase().match(regex2);
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
			var classIDs = cohorts[key].class_ids.concat(cohorts[key].closed_class_ids);
			var apiCallPromises = classIDs.map(gradCheckPointIDAPICall);
			idPromiseCollector.push(apiCallPromises);
			gradClassIDs[key].promises = apiCallPromises;
		});

		Promise.all(idPromiseCollector.reduce(function(prev,curr){
			return prev.concat(curr);
		}))
			.then(function(res){
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

				Promise.all(collectorForClassIDPromisesInEachCohort)
					.then(function(res){
						cohortKeys.forEach(function(key){
							cohorts[key].graduate_checkpoint_ids = gradClassIDs[key].graduate_checkpoint_ids;
							cohorts[key].first_shift_checkpoint_ids = gradClassIDs[key].first_shift_checkpoint_ids;
						});
						var timeTook = (Date.now()-start)/1000;
						console.log(`Done. Took ${timeTook} seconds`);
						resolve(cohorts);
					}).catch(errorHandler);
			}).catch(errorHandler);
	});
}
//finds total users who graduated and users who took first shift
function getTotalUsersWhoTookFirstShiftAndGraduated(cohorts){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		console.log('Calculating graduates and people who started first shift...');
		var cohortKeys = Object.keys(cohorts);
		//construct array of url objects with info on which cohort they belong to and which checkpoint they're hitting
		var urls = [];
		cohortKeys.forEach(function(key){
			cohorts[key].graduates = [];
			cohorts[key].started_first_shift = [];
			cohorts[key].graduate_checkpoint_ids.forEach(function(classID){
				var url = {};
				url.cohort = key;
				url.url = `audit/grade_change/assignments/${classID}?per_page=1000`;
				url.checkpoint = 'graduation'
				urls.push(url);
			});
			cohorts[key].first_shift_checkpoint_ids.forEach(function(classID){
				var url = {};
				url.cohort = key;
				url.url = `audit/grade_change/assignments/${classID}?per_page=1000`;
				url.checkpoint = 'first shift'
				urls.push(url);
			});
		});
		//function to throttle number of requests per second
		function throttledURLCalls(urls, reqPerSecond, callback){
			var intervalValue = 1000/reqPerSecond;
			var requestCollector = [];
			var count = 0;
			var go = setInterval(function(){
				// var thisGen = gen.next();
				if(urls[count] === undefined){
					//when done, go to next part of code that processes the info from the requests
					clearInterval(go);
					if(callback) callback(requestCollector);
				}else{
					//create objects with cohort number, request promise, and which checkpoint the request hits
					var urlObj = urls[count];
					var requestPromise = request(urlObj.url, 'Canvas', 'GET');
					var newReqObj = {};
					newReqObj.cohort = urlObj.cohort;
					newReqObj.request = requestPromise;
					newReqObj.checkpoint = urlObj.checkpoint;
					requestCollector.push(newReqObj);
					count++;
				}
			}, intervalValue);
		}
		//callback that processes info from API requests
		function processAPIRequests(urlReqs){
			var requestPromises = urlReqs.map(function(obj){
				return obj.request;
			});
			//once all the reuests finish, calculate grads and people who took first shift by counting how many people passed each checkpoint
			Promise.all(requestPromises)
				.then(function(res){
					var requestsProcessed = [];
					urlReqs.forEach(function(obj){
						var requestToProcess = obj.request.then(function(assignment){
							var numberPassed = assignment.events.filter(function(event){ return event.grade_after === 'complete'; }).length;
							if(obj.checkpoint === 'graduation'){
								cohorts[obj.cohort].graduates.push(numberPassed);
							} else if(obj.checkpoint === 'first shift'){
								cohorts[obj.cohort].started_first_shift.push(numberPassed);
							}
						}).catch(errorHandler);
						requestsProcessed.push(requestToProcess);
					});
					Promise.all(requestsProcessed)
						.then(function(res){
							cohortKeys.forEach(function(key){
								cohorts[key].graduates = cohorts[key].graduates.reduce(function(a,b){ return a+b; }, 0);
								cohorts[key].started_first_shift = cohorts[key].started_first_shift.reduce(function(a,b){ return a+b; }, 0);
								delete cohorts[key].graduate_checkpoint_ids;
								delete cohorts[key].first_shift_checkpoint_ids;
								delete cohorts[key].class_ids;
								delete cohorts[key].closed_class_ids;
							});
							var timeTook = (Date.now()-start)/1000;
							console.log(`Done. Took ${timeTook} seconds`);
							resolve(cohorts);
						}).catch(errorHandler);
				}).catch(errorHandler);
		}
		throttledURLCalls(urls, APICallsPerSecond, processAPIRequests);
	});
}

// posts cohortInfo on slack
function notifySlack(cohortInfo) {
	var payload = {
		channel: SLACK_CHANNEL,
	};
	payload.text = 'Melted user data by cohort:\n\n';
	var cohortKeys = Object.keys(cohortInfo);
	cohortKeys.forEach(function(key){
		payload.text += `For cohort ${key}:\n`;
		payload.text += `${cohortInfo[key].enrolled_in_canvas} users enrolled in Canvas\n`;
		payload.text += `${cohortInfo[key].accepted_into_training} users accepted into training\n`;
		payload.text += `${cohortInfo[key].graduates} users graduated\n`;
		payload.text += `${cohortInfo[key].started_first_shift} users started their first shift\n\n`;
	});

	fetch(KEYS.slackAccountURL, {
	method: 'POST',
	body: JSON.stringify(payload)
	}).catch(function(error) {
		CONSOLE_WITH_TIME('Failed to post to the graduate slack channel: ',error);
	});
}
// function writeDataToCSVFile(cohorts){
// 	var CSVstring = 'cohorts;';
// 	var cohortKeys = Object.keys(cohorts);
// 	var subObjectKeys = Object.keys(cohorts[cohortKeys[0]]);
// 	subObjectKeys.forEach(function(key){
// 		CSVstring += key + ';';
// 	})
// 	CSVstring = CSVstring.substring(0, CSVstring.length-1);
// 	cohortKeys.forEach(function(cohortNum){
// 		var nextLine = '\n' + cohortNum + ';';
// 		subObjectKeys.forEach(function(metric){
// 			nextLine += cohorts[cohortNum][metric] + ';';
// 		});
// 		nextLine = nextLine.substring(0, nextLine.length-1);
// 		CSVstring += nextLine;
// 	});
// 	var CSVfilePath = 'meltedData.csv'
// 	fs.writeFile(CSVfilePath, CSVstring, function(err){
// 		if(err) return console.error(err);
// 		console.log(`CSV file ${CSVfilePath} written.`);
// 	});
// 	return cohorts;
// }
//wrap in Cronjob
// go();

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
  }).catch(function(err){
  	console.log(text);
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

module.exports = { cohortDataPromise: go() }
