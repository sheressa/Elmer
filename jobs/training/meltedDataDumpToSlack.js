'use strict';

const internalRequest = require('request');
const fetch = require('node-fetch');
const APICallsPerSecond = 10;
const SLACK_CHANNEL = '#training';
const moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");



function errorHandler(err){
	try{
		JSON.parse(err);
		console.error(`Error: ${JSON.stringify(err)}`);
	} catch(e){
		console.error(`Error: ${err}`);
	}
	
}
//promise chain that gathers information from Canvas and CTLOnline and posts it to Slack
function postMeltedUserDataToSlack(){
	return getCohortNumbers()
		.then(getEnrollmentsFromCohort)
		.then(getTotalAcceptedIntoTraining)
		.then(getGradAndFirstShiftCheckpointIDsForEachCohort) 
		.then(getTotalUsersWhoTookFirstShiftAndGraduated)	
		.then(notifySlack)
		.catch(errorHandler);
}

//MAIN FUNCTIONS
//parses cohort numbers from courses in Canvas
function getCohortNumbers(){
	return new Promise(function(resolve, reject){
		CONSOLE_WITH_TIME('Getting cohorts from Canvas');
		var start = Date.now();
		request(`accounts/${KEYS.canvas.accountID}/courses?per_page=100&enrollment_type[]=student`, 'Canvas')
		  	.then(function (courses) {
	    		var previous;
		    	var cohorts = {};
		    	courses.forEach(function (course) {
					/*parses cohortNumber from 'course name'. regex may be better
					if cohort naming changes format, cohort numbers will be incorrect
					maybe look for better methods for retrieving cohort number*/
					var nameArr = course.name.trim().split(' ');
					var cohortNumber = nameArr[1];
					if(isNaN(cohortNumber) || nameArr[0].toLowerCase() !== 'cohort') return;
					if(!cohorts[cohortNumber]){
						cohorts[cohortNumber] = {};
						cohorts[cohortNumber].class_ids = [];
						cohorts[cohortNumber].closed_class_ids = [];
					}
					if(course.workflow_state==='available'){
						cohorts[cohortNumber].class_ids.push(course.id);
					} else if(course.workflow_state==='completed'){
						cohorts[cohortNumber].closed_class_ids.push(course.id);
					}
					/*For some cohorts, the courses are marked 'completed'. 
					These are closed courses. I've tallied them separately from open ones
					in the case that data needs to be handled differently from open
					courses. Both lists of courses are concatenated in the end*/
				});
				var cohortKeys = Object.keys(cohorts);
				cohortKeys.forEach(function(key){
					if(cohorts[key].class_ids.length == 0) delete cohorts[key];
				});
				var timeTook = (Date.now()-start)/1000;
				CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			}).catch(function(err){
				console.error(`Error processing data from course list: ${err}`);
			});
	}).catch(errorHandler);
}

//pulls data from Canvas to find the number of users enrolled in Canvas for each cohort. Also gathers basic user data
function getEnrollmentsFromCohort(cohorts){
	return new Promise(function(resolve, reject){
		//iterate through cohorts object and create object for enrollment in each class
		var start = Date.now();
		CONSOLE_WITH_TIME('Getting enrolled students...');
		var enrollmentLengths = getEnrollmentLengths(cohorts);
	
		//wait for class enrollment API calls and enrollment tallies, then put into output object
		Promise.all(enrollmentLengths.sumTallyPromiseArray)
			.then(function(res){
				Object.keys(enrollmentLengths.cohortEnrollments).forEach(function(key){
					enrollmentLengths.cohortEnrollments[key].then(function(tallyData){
						cohorts[key].enrolled_in_canvas = tallyData.enrollment;
						cohorts[key].users = tallyData.users;
					});
				});
				var timeTook = (Date.now()-start)/1000;
				CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			}).catch(function(err){
				CONSOLE_WITH_TIME(`Something went wrong adding enrollment numbers and user data to the main cohort object: ${err}`);
			});
	}).catch(errorHandler);
}

//obtains total number of user accepted into training for each cohort from CTLOnline
function getTotalAcceptedIntoTraining(cohorts){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		CONSOLE_WITH_TIME('Getting total number accepted into training (takes a few seconds)...');
		var tallyPromiseArray = [];	
		for (var key in cohorts){
			if(!cohorts.hasOwnProperty(key)){
				continue;
			}
			tallyPromiseArray.push(acceptanceAPICall(key));
		}
		//wait for class enrollment API calls and enrollment tallies, then put into output object
		Promise.all(tallyPromiseArray)
			.then(function(res){
				var tallyPromisesToCohortObject = [];
				tallyPromiseArray.forEach(function(tally){
					var tallyToCohort = tally.then(function(acceptanceNum){
						cohorts[acceptanceNum.cohortNum].accepted_into_training = acceptanceNum.accepted;
					});
					tallyPromisesToCohortObject.push(tallyToCohort);
				});
				
				Promise.all(tallyPromisesToCohortObject)
					.then(function(){
						var timeTook = (Date.now()-start)/1000;
						CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
						resolve(cohorts);
					}).catch(errorHandler);
			})
			.catch(function(err){
				CONSOLE_WITH_TIME(`Something went wrong while waiting for enrollment data to resolve: ${err}`);
			});
	}).catch(errorHandler);
}
//obtains the ids for the graduation and first shift checkpoints
function getGradAndFirstShiftCheckpointIDsForEachCohort(cohorts){
	return new Promise(function(resolve,reject){
		var start = Date.now();
		CONSOLE_WITH_TIME('Obtaining info on grads and people who started first shift...');
		var cohortKeys = Object.keys(cohorts);
		var gradClassIDs = buildGradClassIDObject(cohortKeys);
		var APIcheckpointPromises = gatherGradCheckpointAPICallPromises(cohorts, gradClassIDs);
		var idPromiseCollector = APIcheckpointPromises.idPromiseCollector;
		gradClassIDs = APIcheckpointPromises.gradClassIDs;		
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
						CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
						resolve(cohorts);
					}).catch(function(err){
						CONSOLE_WITH_TIME(`Something went wrong adding graduate and first shift checkpoint ids to cohort data: ${err}`);
					});
			}).catch(function(err){
				console.error(`Something went wrong retrieving and adding graduate and first shift checkpoint ids to cohort data: ${err}`);
			});
	}).catch(errorHandler);
}
//finds total users who graduated and users who took first shift
function getTotalUsersWhoTookFirstShiftAndGraduated(cohorts){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		CONSOLE_WITH_TIME('Calculating graduates and people who started first shift...');
		var cohortKeys = Object.keys(cohorts);
		//construct array of url objects with info on which cohort they belong to and which checkpoint they're hitting
		var urls = [];
		cohortKeys.forEach(function(key){
			cohorts[key].graduates = [];
			cohorts[key].started_first_shift = [];
			cohorts[key].graduate_checkpoint_ids.forEach(function(checkID){
				var url = {};
				url.cohort = key;
				url.url = `audit/grade_change/assignments/${checkID}?per_page=100`;
				url.checkpoint = 'graduation'
				urls.push(url);
			});
			cohorts[key].first_shift_checkpoint_ids.forEach(function(checkID){
				var url = {};
				url.cohort = key;
				url.url = `audit/grade_change/assignments/${checkID}?per_page=100`;
				url.checkpoint = 'first shift'
				urls.push(url);
			});
		});
		throttledURLCallsForFirstShiftAndGraduated(urls, APICallsPerSecond, cohorts, processAPIRequestsForFirstShiftAndGraduated)
			.then(function(cohortObj){
				cohortKeys.forEach(function(key){
					cohorts[key].graduates = cohortObj[key].graduates.reduce(function(a,b){ return a+b; }, 0);
					cohorts[key].started_first_shift = cohortObj[key].started_first_shift.reduce(function(a,b){ return a+b; }, 0);
					delete cohorts[key].graduate_checkpoint_ids;
					delete cohorts[key].first_shift_checkpoint_ids;
					cohorts[key].class_ids = cohorts[key].class_ids.concat(cohorts[key].closed_class_ids);
					delete cohorts[key].closed_class_ids;
				});
				var timeTook = (Date.now()-start)/1000;
				CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			});
	}).catch(errorHandler);
}

// posts cohortInfo on slack
function notifySlack(cohortInfo) {
	return new Promise(function(reject,resolve){
		var start = Date.now();
		CONSOLE_WITH_TIME('Posting data to Slack channel...');
		var payload = {
			channel: SLACK_CHANNEL,
		};
		var nowArr = new Date().toString().split(' ');
		var weekday = nowArr[0];
		var month = nowArr[1];
		var date = nowArr[2];
		var year = nowArr[3];

		payload.text = `*Melted user data by Cohort on ${weekday}, ${month} ${date}, ${year}:*\n\n`;
		var cohortKeys = Object.keys(cohortInfo);
		cohortKeys.forEach(function(key){
			payload.text += `_*For Cohort ${key}:*_\n`;
			payload.text += `    _*${cohortInfo[key].enrolled_in_canvas}* users enrolled in Canvas_\n`;
			payload.text += `    _*${cohortInfo[key].accepted_into_training}* users accepted into training_\n`;
			payload.text += `    _*${cohortInfo[key].graduates}* users graduated_\n`;
			payload.text += `    _*${cohortInfo[key].started_first_shift}* users started their first shift_\n\n`;
		});
		fetch(KEYS.slackAccountURL, {
			method: 'POST',
			body: JSON.stringify(payload)
		})
		.then(function(res){
			var timeTook = (Date.now()-start)/1000;
			CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
			resolve(cohortInfo);
		}).catch(function(err){
			console.error(`Failed to post to channel ${SLACK_CHANNEL}: ${err}`);
		});
	}).catch(errorHandler);
	
}

//HELPER FUNCTIONS
//for each cohort, call API for enrollment and tally in 'cohortEnrollments' object
function getEnrollmentLengths(cohortObj){
	var cohortKeys = Object.keys(cohortObj);
	var cohortEnrollments = cohortKeys.reduce(function(prev,curr){
		prev[curr] = {};
		prev[curr].enrolled_into_canvas = [];
		return prev;
	}, {});
	var sumTallyPromiseArray = [];	

	cohortKeys.forEach(function(key){
		if(!cohortObj.hasOwnProperty(key)){
			return;
		}
		var classes = cohortObj[key].class_ids.concat(cohortObj[key].closed_class_ids);
		var classAPICalls = Promise.all(classes.map(enrollmentLengthAPICall));
		var sumTallyPromise = classAPICalls
			.then(function(data){
				var tally = data.map(function(obj){
					return obj.enrollment_length;
				}).reduce(function(a,b){
					return a+b;
				}, 0);
				
				var users = data.map(function(obj){
					return obj.students;
				}).reduce(function(prev, curr){
					return prev.concat(curr);
				});
				return {
					enrollment: tally,
					users: users
				};
			})
			.catch(function(err){
				console.error(`Something went wrong while tallying enrollment: ${err}`);
			});
			
		cohortEnrollments[key] = sumTallyPromise;
		sumTallyPromiseArray.push(sumTallyPromise);
	});

	return {
		cohortEnrollments: cohortEnrollments,
		sumTallyPromiseArray: sumTallyPromiseArray
	};
}
//calls recursive function to Canvas to get all pages
function enrollmentLengthAPICall(courseNum){
	return recursiveRequestCallerForEnrollmentLength(0,1,[],courseNum);
}

//goes through Canvas pagination and returns enrollment length for courses
function recursiveRequestCallerForEnrollmentLength(enrolled, pageNumber, allStudents,courseNum){
	return request(`courses/${courseNum}/enrollments?per_page=100&page=${pageNumber}&type[]=StudentEnrollment&state[]=active&state[]=completed&state[]=inactive`, 'Canvas')
		.then(function(enrollment){
			if(enrollment.length == 0){
				return {
					enrollment_length: enrolled,
					students: allStudents
				}
			}
			enrolled += enrollment.length;
			pageNumber += 1;
			allStudents = allStudents.concat(enrollment.map(function(user){
				//change to output more data for CSV dump
				return {
					user_id: user.user_id,
					name: user.user.name,
					sortable_name: `\"${user.user.sortable_name}\"`,
					email: user.user.sis_login_id,
					course_id: courseNum,
					last_assignment_completed_timestamp: null,
					last_assignment_completed_id: null,
					grader_id: null
				};
			}));
			return recursiveRequestCallerForEnrollmentLength(enrolled, pageNumber, allStudents,courseNum);
		}).catch(function(err){
			console.error(`Something went wrong while obtaining enrollment info for course ${courseNum}: ${err}`);
		});
}

function acceptanceAPICall(cohortNum){
	//CTL online only returns 20 users per request, recursively gets data from each page
	return recursiveRequestCallerForAcceptance(0,1,cohortNum);
}

//goes through CTLOnline to get acceptance tally
function recursiveRequestCallerForAcceptance(accepted, pageNumber,cohortNum){
	return request(`parameters[field_cohort]=${cohortNum}&page=${pageNumber}`, 'CTL')
		.then(function(acceptance){
			if(acceptance[0] === 'No entities found.'){
				var cohortAccepted = {};
				cohortAccepted.cohortNum = cohortNum;
				cohortAccepted.accepted = accepted;
				return cohortAccepted;
			}
			accepted += acceptance.length;
			pageNumber += 1;
			return recursiveRequestCallerForAcceptance(accepted, pageNumber,cohortNum);
		}).catch(function(err){
			console.error(`Something went wrong obtaining data from users in cohort ${cohortNum} from CTLOnline: ${err}`);
		});
}

//api call to Canvas to see how many students funished the grad and first shift checkpoint
function gradCheckPointIDAPICall(classID){
	return request(`courses/${classID}/assignments?per_page=100`, 'Canvas')
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
		.catch(function(err){
			console.error(`Something went wrong retriving and processing assignment info for course ${classID} on Canvas: ${err}`);
		});
}
//function to throttle number of requests per second for grad and first shift API calls
function throttledURLCallsForFirstShiftAndGraduated(urls, reqPerSecond, cohorts, callback){
	return new Promise(function(resolve,reject){
		var intervalValue = 1000/reqPerSecond;
		var requestCollector = [];
		var count = 0;
		
		var go = setInterval(function(){
			if(urls[count] === undefined){
				//when done, go to next part of code that processes the info from the requests
				clearInterval(go);
				callback(cohorts, requestCollector).then(function(cohorts){
					resolve(cohorts);
				});
				
			}else{
				//create objects with cohort number, request promise, and which checkpoint the request hits
				var urlObj = urls[count];
				var requestPromise = request(urlObj.url, 'Canvas').catch(function(err){
					console.error(`Something went wrong retrieving data from ${urlObj.url}: ${err}`);
				});
				var newReqObj = {};
				newReqObj.cohort = urlObj.cohort;
				newReqObj.request = requestPromise;
				newReqObj.checkpoint = urlObj.checkpoint;
				requestCollector.push(newReqObj);
				count++;
			}
		}, intervalValue);
	});
}
//builds object to collect data for grad and first shift checkpoint ids
function buildGradClassIDObject(cohortKeys){
	return cohortKeys.reduce(function(prev,curr){
		prev[curr] = {};
		prev[curr].graduate_checkpoint_ids = [];
		prev[curr].promises = null;
		prev[curr].first_shift_checkpoint_ids = [];
		return prev;
	},{});
}
//callback that processes info from API requests
function processAPIRequestsForFirstShiftAndGraduated(cohorts, urlReqs){
	return new Promise(function(resolve,reject){
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
					}).catch(function(err){
						console.error(`Something went wrong while obtaining assignment information: ${err}`);
					});
					requestsProcessed.push(requestToProcess);
				});
				Promise.all(requestsProcessed)
					.then(function(res){
						resolve(cohorts);
					}).catch(function(err){
						console.error(`Something went wrong processing data for graduates and users who started their first shift: ${err}`);
					});
			}).catch(function(err){
				console.error(`Something went wrong processing data for graduates and users who started their first shift: ${err}`);
			});
		}).catch(errorHandler);
}

//accumulates grad ID promises
function gatherGradCheckpointAPICallPromises(cohorts, gradClassIDs){
	var idPromiseCollector = [];
	var cohortKeys = Object.keys(cohorts);
	cohortKeys.forEach(function(key){
		var classIDs = cohorts[key].class_ids.concat(cohorts[key].closed_class_ids);
		var apiCallPromises = classIDs.map(gradCheckPointIDAPICall);
		idPromiseCollector.push(apiCallPromises);
		gradClassIDs[key].promises = apiCallPromises;
	});
	return {
		idPromiseCollector: idPromiseCollector,
		gradClassIDs: gradClassIDs
	};
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
 		CONSOLE_WITH_TIME(text);
  });
}
// sets up basic api call functionality
function request(url, API, method,params) {
  if (!params) {
    params = [];
  }

  if(API === 'Canvas'){
  	url = `https://crisistextline.instructure.com/api/v1/${url}`;
  } else if (API === 'CTL'){
  	url = `https://online.crisistextline.org/api/v1/entity_user?api-key=${KEYS.CTLOnline.api_key}&${url}`;
  }
  
  var fetchData = {
  	method: method,
  	body: params
  }

  if(API == 'Canvas'){
  	fetchData['headers'] = {'Authorization': KEYS.canvas.api_key};
  }

  return fetch(url, fetchData)
  .then(function (res) { return res.text(); })
  .then(convertIds);
}

module.exports = { 	
					cohortDataPromise: postMeltedUserDataToSlack(), 
					request: request			
				 };
