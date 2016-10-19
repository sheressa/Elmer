'use strict';
const cohortPromise = require('./meltedDataDumpToSlack.js').cohortDataPromise;
const APICallsPerSecond = 10;
const fs = require('fs');
const request = require('./meltedDataDumpToSlack.js').request;

function errorHandler(err){
	try{
		JSON.parse(err);
		console.error(`Error: ${JSON.stringify(err)}`);
	} catch(e){
		console.error(`Error: ${err}`);
	}
	
}

function go(){
	return cohortPromise
		.then(getCheckpointIDsFromClasses)
		.then(getLastCompletedCheckpointForEachUser)
		// .then(putUserCohortInfoInCSVFile)
		// .then(function(res){
		// 	CONSOLE_WITH_TIME(res);
		// 	return res;
		// })
		.catch(function(err){
			console.error('Error: ', err)
		});
}
//obtains checkpoints from every class
function getCheckpointIDsFromClasses(cohorts){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		CONSOLE_WITH_TIME("Getting checkpoint ID's from classes");
		var cohortKeys = Object.keys(cohorts);
		var assignmentPromises = [];
		cohortKeys.forEach(function(cohortNum){
			//collect the ID's for each checkpoint
			cohorts[cohortNum].assignmentNamesAndIDs = [];
			cohorts[cohortNum].class_ids.forEach(function(classNum){
				assignmentPromises.push(checkpointIDAPICall(classNum, cohortNum));
			});
		});
		var assignmentPromiseResponses = [];
		Promise.all(assignmentPromises)
			.then(function(res){
				assignmentPromises.forEach(function(assignPromise){
					var addAssignmentInfoToCohortInfo = assignPromise.then(function(assignmentInfo){
						assignmentInfo.forEach(function(assignObj){
							var assignmentIDpair = {};
							assignmentIDpair.name = assignObj.name;
							assignmentIDpair.id = assignObj.assignment_id;
							cohorts[assignObj.cohort].assignmentNamesAndIDs.push(assignmentIDpair);
						});
					});
					assignmentPromiseResponses.push(addAssignmentInfoToCohortInfo);
				});
				Promise.all(assignmentPromiseResponses)
					.then(function(res){
						var timeTook = (Date.now()-start)/1000;
						CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
						resolve(cohorts);
					}).catch(errorHandler);
			});
	});
}

function getLastCompletedCheckpointForEachUser(cohorts){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		CONSOLE_WITH_TIME('Getting last complete checkpoint for each user...');
		var cohortKeys = Object.keys(cohorts);
		var urls = [];
		cohortKeys.forEach(function(key){
			cohorts[key].assignmentNamesAndIDs.forEach(function(assignNameID){
				urls.push({
					url: `audit/grade_change/assignments/${assignNameID.id}?per_page=100`,
					cohort: key
				});
			});
		});

		throttledURLCallsForGradeChanges(urls, APICallsPerSecond)
			.then(function(gradeChangeInfoRequests){
				Promise.all(gradeChangeInfoRequests)
					.then(function(){
						var promisesToAppendAssignmentInfoToUsers = [];
						gradeChangeInfoRequests.forEach(function(req){
							promisesToAppendAssignmentInfoToUsers.push(req.then(function(assignChanges){
								assignChanges.forEach(function(changeObj){
									cohorts[changeObj.cohort].users.filter(function(user){
										return changeObj.user_id == user.user_id;
									}).map(function(user){
										if(!user.last_assignment_completed_timestamp || user.last_assignment_completed_timestamp.isBeforeTime(changeObj.timestamp)){
											user.last_assignment_completed_timestamp = changeObj.timestamp;
											user.last_assignment_completed_id = changeObj.assignment_id;
											user.grader_id = changeObj.grader_id;
										}
									});
								});
							}));
						});
						Promise.all(promisesToAppendAssignmentInfoToUsers)
							.then(function(){
								var timeTook = (Date.now()-start)/1000;
								CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
								var keys = Object.keys(cohorts[18].users[4]);
								keys.forEach(function(key){
									CONSOLE_WITH_TIME(key + ': ' + cohorts[18].users[4][key]);
								});
								resolve(cohorts);	
							}).catch(errorHandler);
					}).catch(errorHandler);
			}).catch(errorHandler);;
	});
}

function putUserCohortInfoInCSVFile(cohorts){
	var cohortKeys = Object.keys(cohorts);
	cohortKeys.forEach(function(cohortNum){
		var csvOutput = '';
		cohorts[cohortNum].users.forEach(function(user){

		});

	});

	fs.writeFile('./data.json', JSON.stringify(obj) , 'utf-8');
}
go();

//helper methods
function checkpointIDAPICall(courseNum, cohortNum){
	return request(	`courses/${courseNum}/assignments?per_page=1000`, 'Canvas')
		.then(function(assignments){
			return assignments.map(function(assignment){
				return {
					name: assignment.name,
					assignment_id: assignment.id,
					cohort: cohortNum
				};
			});
		}).catch(function(err){
			CONSOLE_WITH_TIME(`Something went wrong with the assignment call to course number ${courseNum}: ${err}`);
		});
}
function getGradeChangesForAssignmentAPICall(url, cohortNum){
	return request(url, 'Canvas')
		.then(function(assignChange){
			var assignChanges = [];
			assignChange.events.forEach(function(change){
				var changeObj = {};
				if(change.grade_after !== null && change.event_type === "grade_change"){
					changeObj.timestamp = change.created_at;
					changeObj.cohort = cohortNum;
					changeObj.assignment_id = change.links.assignment;
					changeObj.user_id = change.links.student;
					changeObj.course_id = change.links.course;
					changeObj.grader_id = change.links.grader;
					assignChanges.push(changeObj);
				}
			});
			return assignChanges;
		}).catch(function(err){
			console.error(`Problem getting grade change info for ${url}: ${err}`);
		});
}

function throttledURLCallsForGradeChanges(urls, reqPerSecond){
	return new Promise(function(resolve,reject){
		var intervalValue = 1000/reqPerSecond;
		var requestCollector = [];
		var count = 0;
		
		var go = setInterval(function(){
			if(urls[count] === undefined){
				//when done, go to next part of code that processes the info from the requests
				clearInterval(go);
				resolve(requestCollector);
				
			}else{
				//create objects with cohort number, request promise, and which checkpoint the request hits
				var urlObj = urls[count];
				var requestPromise = getGradeChangesForAssignmentAPICall(urlObj.url, urlObj.cohort);
				requestCollector.push(requestPromise);
				count++;
			}
		}, intervalValue);
	});
}

//extends the String and Number types with a method called 'isBeforeTime', which takes a time string or integer
//and checks to see if it occurs before another time (also string or integer). For example: For time1.isBeforeTime(time2), if time1 takes
//place before time2, this method returns true. Otherwise, false. 
var timeCompare = function(time){
	var firstTime = this;
	if(typeof time != 'number' && typeof time != 'string'){
		throw new Error("Input time is is the wrong type (not a string or integer).");
	}

	if(!isNaN(firstTime)) firstTime = Number(firstTime);
	if(!isNaN(time)) time = Number(time);

	var thisTime, thatTime;
	thisTime = new Date(firstTime);
	thatTime = new Date(time);
	
	if ( Object.prototype.toString.call(thisTime) !== "[object Date]" ){
		throw new Error('First string is not a parsable date.');
	}
	if ( Object.prototype.toString.call(thatTime) !== "[object Date]" ){
		throw new Error('Input time is not a parsable date.');
	}
	if(isNaN(thisTime.getTime()) || isNaN(thatTime.getTime())){
		throw new Error('String is not a valid date.');
	}

	return thisTime < thatTime;
}
//extends String and Number types with function to compare Date strings and integers
String.prototype.isBeforeTime = String.prototype.isBeforeTime || timeCompare;
Number.prototype.isBeforeTime = Number.prototype.isBeforeTime || timeCompare;

function errorHandler(err){
	console.error('Error: ', err);
}