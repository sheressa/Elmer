// 'use strict';
// const cohortPromise = require('./meltedDataDumpToSlack.js').cohortDataPromise;
// const CronJob = require('cron').CronJob;
// const internalRequest = require('request');
// const fetch = require('node-fetch');
// const KEYS = require('./keys.js');
// const fs = require('fs');
// const APICallsPerSecond = 10;
// const request = require('./meltedDataDumpToSlack.js').request;

// function go(){
// 	return cohortPromise
// 		.then(getCheckpointIDsFromClasses)
// 		.then(getLastCompletedCheckpointForEachUser)
// 		.catch(function(err){
// 			console.error('Error: ', err)
// 			return err;
// 		});
// }

// function getCheckpointIDsFromClasses(cohorts){
// 	return new Promise(function(resolve, reject){
// 		var cohortKeys = Object.keys(cohorts);

// 		function checkpointInfoAPICall(courseNum, cohortNum){
// 			return request(	`courses/${courseNum}/assignments?per_page=1000`, 'Canvas', 'GET')
// 				.then(function(assignments){
// 					return assignments.map(function(assignment){
// 						return {
// 							name: assignment.name,
// 							assignment_id: assignment.id,
// 							cohort: cohortNum
// 						};
// 					});
// 				}).catch(function(err){
// 					CONSOLE_WITH_TIME(`Something went wrong with the assignment call to course number ${courseNum}: ${err}`);
// 				});
// 		}
// 		var assignmentPromises = [];
// 		cohortKeys.forEach(function(cohortNum){
// 			//collect the ID's for each checkpoint
// 			cohorts[cohortNum].assignmentNamesAndIDs = {};
// 			cohorts[cohortNum].class_ids.forEach(function(classNum){
// 				assignmentPromises.push(checkpointInfoAPICall(classNum, cohortNum));
// 			});
// 		});
// 		var assignmentPromiseResponses = [];
// 		Promise.all(assignmentPromises)
// 			.then(function(res){
// 				assignmentPromises.forEach(function(assignPromise){
// 					// console.log(assignPromise);
// 					var addAssignmentInfoToCohortInfo = assignPromise.then(function(assignmentInfo){
// 						// console.log(assignmentInfo.cohort);
// 						assignmentInfo.forEach(function(assignObj){
// 							// console.log(cohorts[assignObj.cohort]);
// 							cohorts[assignObj.cohort].assignmentNamesAndIDs[assignObj.assignment_id] = assignObj.name;
// 						});
						
// 					});
// 					assignmentPromiseResponses.push(addAssignmentInfoToCohortInfo);
// 				});
// 				// console.log(assignmentPromiseResponses);
// 				Promise.all(assignmentPromiseResponses)
// 					.then(function(res){
// 						resolve(cohorts);
// 					}).catch(errorHandler);
// 			});
// 	});
// }



// function getLastCompletedCheckpointForEachUser(cohorts){
// 	return new Promise(function(resolve, reject){
// 		var cohortKeys = Object.keys(cohorts);
// 		var urls = [];
// 		cohortKeys.forEach(function(key){
// 			cohorts[key].users.forEach(function(user){
// 				var urlForUser = user;
// 				urlForUser.url = `audit/grade_change/students/${user.user_id}`;
// 				urlForUser.cohort = key;
// 				urls.push(urlForUser);
// 			});
// 		});
// 		function throttledURLCalls(urls, reqPerSecond, callback){
// 			var intervalValue = 1000/reqPerSecond;
// 			var requestCollector = [];
// 			var count = 0;
// 			var go = setInterval(function(){
// 				if(urls[count] === undefined){
// 					//when done, go to next part of code that processes the info from the requests
// 					clearInterval(go);
// 					console.log('done with generating requests');
// 					if(callback) callback(requestCollector);
// 				}else{
// 					//create objects with cohort number, request promise, and which checkpoint the request hits
// 					var userObj = urls[count];
// 					userObj.request = request(userObj.url, 'Canvas', 'GET').catch(errorHandler);
// 					requestCollector.push(userObj);
// 					count++;
// 				}
// 			}, intervalValue);
// 		}
// 		function processAPIRequests(urlReqs){
// 			var requestPromises = urlReqs.map(function(obj){
// 				return obj.request;
// 			});

// 			Promise.all(requestPromises)
// 				.then(function(){
// 					console.log('requests resolved, processing info');
// 					var requestsProcessed = [];
// 					var userObjects = [];
// 					urlReqs.forEach(function(userObj){
// 						var requestToProcess = userObj.request.then(function(assignmentChangeData){
// 							var count = 0;
// 							var assignID;
// 							do{
// 								if(assignmentChangeData.events[count].length === 0) assignID = null;
// 								else assignID = assignmentChangeData.events[count].links.assignment;
// 								count++;
// 							} while(assignmentChangeData.events[count].grade_after === null);
// 							userObj.lastAssignmentCompleted = assignID;
// 						}).catch(errorHandler);
// 						requestsProcessed.push(requestToProcess);
// 						userObjects.push(userObj);
// 					});
// 					Promise.all(requestsProcessed)
// 						.then(function(){
// 							console.log('done');
// 							fs.writeFile('../../../output.json', JSON.stringify(userObjects, null, 2), 'utf-8');
// 							resolve(userObjects);
// 						});
// 				})
// 		}

// 		throttledURLCalls(urls, 10, processAPIRequests);
		
// 	});
// }
// go();

// //helper methods
// function errorHandler(err){
// 	console.error('Error: ', err);
// }