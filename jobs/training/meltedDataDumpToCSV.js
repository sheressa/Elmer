'use strict';
/*	
	This job depends on 'meltedDataDumpToSlack.js' to collect
	data to dump to CSV/mySQL
*/
const CronJob = require('cron').CronJob;
const fs = require('fs');
const path = require('path');
const Bluebird = require('bluebird');
const cohortPromise = require('./meltedDataDumpToSlack.js').cohortDataPromise;
const request = require('./meltedDataDumpToSlack.js').request;
const cohortKeys = require('./meltedDataDumpToSlack.js').cohortKeys;
const numberOfConcurrentAPICalls = 5;

function errorHandler(err){
	try{
		JSON.parse(err);
		CONSOLE_WITH_TIME('Error: ', err);
	} catch(e){
		CONSOLE_WITH_TIME(`Error: ${JSON.stringify(err)}`);
	}
}

//Posts melted user data to #training channel on Slack every Wednesday at 10AM
new CronJob(CONFIG.time_interval.melted_users_on_slack_and_csv_cron_job_string, function(){
    postMeltedUserDataToSlackAndCSV();
  }, null, true);

//main function
function postMeltedUserDataToSlackAndCSV(){
	return cohortPromise
		.then(constructUrlsForCheckpointIdApiCalls)
		.then(obtainAssignmentNamesAndIDs)
		.then(constructUrlsForLastCompletedCheckpointApiCalls)
		.then(getLastCompletedCheckpointForEachUser)
		.then(putUserCohortInfoInCSVFile)
		.catch(errorHandler);
}
//creates an array of objects containing a url for each checkpoint ID API call, and the corresponding course and cohort number 
function constructUrlsForCheckpointIdApiCalls(cohorts){
	return new Promise(function(resolve, reject){
		var urls =[];
		cohortKeys.forEach(function(cohortNum){
			//collect the ID's for each checkpoint
			cohorts[cohortNum].assignmentNamesAndIDs = [];
			cohorts[cohortNum].class_ids.forEach(function(classNum){
				urls.push({
					url: `courses/${classNum}/assignments?per_page=100`,
					course: classNum,
					cohort: cohortNum
				});
			});
		});
		resolve({cohorts, urls});
	});
}
//obtains checkpoints from every class
function obtainAssignmentNamesAndIDs({cohorts, urls}){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		CONSOLE_WITH_TIME("Getting checkpoint ID's from classes");
		checkpointIDAPICall(urls)
			.then(function(resolvedAssignmentPromises){
				resolvedAssignmentPromises.forEach(function(assignPromise){
					assignPromise.forEach(function(assignObj){
						var assignmentIDpair = {};
						assignmentIDpair.name = assignObj.name;
						assignmentIDpair.id = assignObj.assignment_id;
						cohorts[assignObj.cohort].assignmentNamesAndIDs.push(assignmentIDpair);
					});
				});
				var timeTook = (Date.now()-start)/1000;
				CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			}).catch(errorHandler);
	});
}		
//creates an array of objects containing a url for the grade change API call, and the corresponding cohort number 
function constructUrlsForLastCompletedCheckpointApiCalls(cohorts){
	return new Promise(function(resolve, reject){
		var urls = [];
		cohortKeys.forEach(function(key){
			cohorts[key].assignmentNamesAndIDs.forEach(function(assignNameID){
				urls.push({
					url: `audit/grade_change/assignments/${assignNameID.id}?per_page=100`,
					cohort: key
				});
			});
		});
		resolve({cohorts, urls});
	});
}
//runs through grade changes and finds last completed checkpoint for each user
function getLastCompletedCheckpointForEachUser({cohorts, urls}){
	return new Promise(function(resolve,reject){
		var start = Date.now();
		CONSOLE_WITH_TIME('Getting last complete checkpoint for each user...');
		getGradeChangesForAssignmentAPICall(urls)
			.then(function(resolvedGradeChangeInfoRequests){
				resolvedGradeChangeInfoRequests.forEach(function(request){
					request.forEach(function(changeObj){
						cohorts[changeObj.cohort].users.filter(function(user){
							return changeObj.user_id == user.user_id;
						}).forEach(function(user){
							if(!user.last_assignment_completed_timestamp || user.last_assignment_completed_timestamp.isBeforeTime(changeObj.timestamp)){
								user.last_assignment_completed_timestamp = changeObj.timestamp;
								user.last_assignment_completed_id = changeObj.assignment_id;
								user.grader_id = changeObj.grader_id;
							}
						});
					});
				});
				var timeTook = (Date.now()-start)/1000;
				CONSOLE_WITH_TIME(`Done. Took ${timeTook} seconds`);
				resolve(cohorts);
			}).catch(errorHandler);
	});
}
		
//posts last checkpoint info into CSV files
function putUserCohortInfoInCSVFile(cohorts){
	cohortKeys.forEach(function(cohortNum){
		var csvOutput = '';
		var userKeys = Object.keys(cohorts[cohortNum].users[0]);
		userKeys.forEach(function(key){
			csvOutput += `${key},`;
		});
		csvOutput += 'last_assignment_completed_name';
		csvOutput += '\n';
		cohorts[cohortNum].users.forEach(function(user){
			userKeys.forEach(function(key){
				if(!user[key]){
					csvOutput += ",";
				} else if(typeof user[key] === 'string' || user[key] instanceof String){
					csvOutput += `\"${user[key]}\",`;
				} else{
					csvOutput += `${user[key]},`;
				}
			});
			var lastAssignName = cohorts[cohortNum].assignmentNamesAndIDs.filter(function(assignIDpair){
				return assignIDpair.id === user.last_assignment_completed_id;
			});
			if(lastAssignName.length === 0){
				csvOutput += '';
			} else{
				csvOutput += lastAssignName[0].name;
			}
			csvOutput += '\n';
		});
		fs.writeFile(path.join(__dirname, '/CSVdump') + `/cohort_${cohortNum}_last_completed_checkpoint_info.csv`, csvOutput, 'utf-8');
	});
	return cohorts;
}

//helper methods
//API call to obtain assignment info
function checkpointIDAPICall(urls){
	return Bluebird.map(urls, function(urlObj){
		return request(urlObj.url, 'Canvas')
			.then(function(assignments){
				return assignments.map(function(assignment){
					return {
						name: assignment.name,
						assignment_id: assignment.id,
						cohort: urlObj.cohort
					};
				});
			}).catch(function(err){
				CONSOLE_WITH_TIME(`Something went wrong with the assignment call to course number ${urlObj.course}: ${err}`);
			});
	}, {concurrency: numberOfConcurrentAPICalls});
}

//API call to grade changes that parses relevant info for CSV file (add more parameters if you want more columns for the CSV file)
function getGradeChangesForAssignmentAPICall(urls){
	return Bluebird.map(urls, function(urlObj){
		return request(urlObj.url, 'Canvas')
			.then(function(assignChange){
				return assignChange.events.filter(function(change){
					return change.grade_after !== null && change.event_type === "grade_change";
				}).map(function(change){
					return {
						timestamp: change.created_at,
						cohort: urlObj.cohort,
						assignment_id: change.links.assignment,
						user_id: change.links.student,
						course_id: change.links.course,
						grader_id: change.links.grader
					};						
				});
			}).catch(errorHandler);
	}, {concurrency: numberOfConcurrentAPICalls});
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
		throw new Error('First time is not a parsable date.');
	}
	if ( Object.prototype.toString.call(thatTime) !== "[object Date]" ){
		throw new Error('Second time is not a parsable date.');
	}
	if(isNaN(thisTime.getTime()) || isNaN(thatTime.getTime())){
		throw new Error('String is not a valid date.');
	}

	return thisTime < thatTime;
}
//extends String and Number types with function to compare Date strings and integers
String.prototype.isBeforeTime = String.prototype.isBeforeTime || timeCompare;
Number.prototype.isBeforeTime = Number.prototype.isBeforeTime || timeCompare;
