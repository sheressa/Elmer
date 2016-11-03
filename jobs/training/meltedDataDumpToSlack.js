'use strict';
/* 	
	This is not run independently. It is a dependency of 'meltedDataDumpToCSV'
	which uses data collected here and dumps it to mySQL, but this is also 
	its own job that dumps user data to Slack.
*/
const internalRequest = require('request');
const fetch = require('node-fetch');
const SLACK_CHANNEL = '#training';
const Bluebird = require('bluebird');
const numberOfConcurrentAPICalls = 5;
const moment = require('moment-timezone');
const cohortKeys = [];
moment.tz.setDefault("America/New_York");

function errorHandler(err){
	try{
		JSON.parse(err);
		CONSOLE_WITH_TIME(`Error: ${err}`);
	} catch(e){
		CONSOLE_WITH_TIME(`Error: ${JSON.stringify(err)}`);
	}
}
//promise chain that gathers information from Canvas and CTLOnline and posts it to Slack
function postMeltedUserDataToSlack(){
	return getCohortNumbers()
		.then(getEnrollmentsFromCohort)
		.then(getTotalAcceptedIntoTraining)
		.then(getGradAndFirstShiftCheckpointIDsForEachCohort) 
		.then(constructURLsForFirstShiftAndGraduatedAPICalls)
		.then(getTotalUsersWhoTookFirstShiftAndGraduated)
		.then(notifySlack);
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
				Object.keys(cohorts).forEach(function(key){
					if(cohorts[key].class_ids.length == 0) delete cohorts[key];
					else cohortKeys.push(key);
				});

				var timeTook = (Date.now()-start)/1000;
				CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			}).catch(function(err){
				CONSOLE_WITH_TIME(`Error processing data from course list: ${err}`);
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
						if(tallyData == undefined) reject();
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
		Bluebird.map(cohortKeys, acceptanceAPICall, {concurrency: numberOfConcurrentAPICalls})
			.then(function(resolvedAcceptanceAPICalls){
				resolvedAcceptanceAPICalls.forEach(function(tally){
					cohorts[tally.cohortNum].accepted_into_training = tally.accepted;
				});
				var timeTook = (Date.now()-start)/1000;
				CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			});
	});
}

//obtains the ids for the graduation and first shift checkpoints
function getGradAndFirstShiftCheckpointIDsForEachCohort(cohorts){
	return new Promise(function(resolve,reject){
		var start = Date.now();
		CONSOLE_WITH_TIME('Obtaining info on grads and people who started first shift...');
		var gradClassIDs = buildGradClassIDObject(cohortKeys);
		var APIcheckpointPromises = gatherGradCheckpointAPICallPromises(cohorts, gradClassIDs);
		var idPromiseCollector = APIcheckpointPromises.idPromiseCollector;
		gradClassIDs = APIcheckpointPromises.gradClassIDs;		
		Promise.all(idPromiseCollector.reduce(function(prev,curr){
			return prev.concat(curr);
		})).then(function(){
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
			return collectorForClassIDPromisesInEachCohort;
		}).then(function(){
			cohortKeys.forEach(function(key){
				cohorts[key].graduate_checkpoint_ids = gradClassIDs[key].graduate_checkpoint_ids;
				cohorts[key].first_shift_checkpoint_ids = gradClassIDs[key].first_shift_checkpoint_ids;
			});
			var timeTook = (Date.now()-start)/1000;
			CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
			resolve(cohorts);
		}).catch(function(err){
			CONSOLE_WITH_TIME(`Something went wrong retrieving and adding graduate and first shift checkpoint ids to cohort data: ${err}`);
		});
	});
}

//creates urls and releveant data and puts them into objects for processing
function constructURLsForFirstShiftAndGraduatedAPICalls(cohorts){
	return new Promise(function(resolve, reject){
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
		resolve({cohorts, urls});
	});
}
//finds total users who graduated and users who took first shift
function getTotalUsersWhoTookFirstShiftAndGraduated({cohorts, urls}){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		CONSOLE_WITH_TIME('Calculating graduates and people who started first shift...');
		Bluebird.map(urls, function(urlObj){
			return request(urlObj.url, 'Canvas')
				.then(function(assignment){
					if(assignment === undefined) reject(`Could not read assignment.`);
					var numberPassed = assignment.events.filter(function(event){ return event.grade_after === 'complete'; }).length;
					if(urlObj.checkpoint === 'graduation'){
						cohorts[urlObj.cohort].graduates.push(numberPassed);
					} else if(urlObj.checkpoint === 'first shift'){
						cohorts[urlObj.cohort].started_first_shift.push(numberPassed);
					}
				});
		}, {concurrency: numberOfConcurrentAPICalls}).then(function(){
			cohortKeys.forEach(function(key){
				cohorts[key].graduates = cohorts[key].graduates.reduce(function(a,b){ return a+b; }, 0);
				cohorts[key].started_first_shift = cohorts[key].started_first_shift.reduce(function(a,b){ return a+b; }, 0);
				delete cohorts[key].graduate_checkpoint_ids;
				delete cohorts[key].first_shift_checkpoint_ids;
				cohorts[key].class_ids = cohorts[key].class_ids.concat(cohorts[key].closed_class_ids);
				delete cohorts[key].closed_class_ids;
			});
			var timeTook = (Date.now()-start)/1000;
			CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
			resolve(cohorts);
		}).catch(errorHandler);
	});
}

// posts cohortInfo on slack
function notifySlack(cohortInfo) {
	return new Promise(function(resolve,reject){
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
			CONSOLE_WITH_TIME(`Failed to post to channel ${SLACK_CHANNEL}: ${err}`);
		});
	});
}

//HELPER FUNCTIONS
//for each cohort, call API for enrollment and tally in 'cohortEnrollments' object
function getEnrollmentLengths(cohortObj){
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
				CONSOLE_WITH_TIME(`Something went wrong while tallying enrollment: ${err}`);
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
			allStudents = allStudents.concat(enrollment.filter(function(user){
				return user.user.sis_login_id != undefined;
			}).map(function(user){
				//change to output more data for CSV dump
				return {
					user_id: user.user_id,
					name: user.user.name,
					sortable_name: user.user.sortable_name,
					email: user.user.sis_login_id,
					course_id: courseNum,
					last_assignment_completed_timestamp: null,
					last_assignment_completed_id: null,
					grader_id: null
				};
			}));
			return recursiveRequestCallerForEnrollmentLength(enrolled, pageNumber, allStudents,courseNum);
		}).catch(function(err){
			CONSOLE_WITH_TIME(`Something went wrong while obtaining enrollment info for course ${courseNum}: ${err}`);
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
			CONSOLE_WITH_TIME(`Something went wrong obtaining data from users in cohort ${cohortNum} from CTLOnline: ${err}`);
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
			CONSOLE_WITH_TIME(`Something went wrong retriving and processing assignment info for course ${classID} on Canvas: ${err}`);
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

//accumulates grad ID promises
function gatherGradCheckpointAPICallPromises(cohorts, gradClassIDs){
	var idPromiseCollector = [];
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
					request: request,
					cohortKeys: cohortKeys			
				 };
