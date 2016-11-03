'use strict';

const assert = require('assert');
const cohortPromise = require('../jobs/training/meltedDataDumpToCSV.js').cohortDataPromise;

var cohortData;
before(function(){
	this.timeout(150000);
	return cohortPromise.then(function(data){
		cohortData = data;
	});
});

describe('data valid', function(){
	it('should show that the amount of people enrolled in Canvas is at least the amount accepted into training', function(){
		var cohortNumber = '19';
		var result = cohortData[cohortNumber].enrolled_in_canvas >= cohortData[cohortNumber].accepted_into_training;
		assert(result);
	});

	it('should show that the amount of people accepted into training is at least the amount of graduates', function(){
		var cohortNumber = '21';
		var result = cohortData[cohortNumber].accepted_into_training >= cohortData[cohortNumber].graduates;
		assert(result);
	});

	it('should show that the amount of people who graduated is at least the amount who started their first shift', function(){
		var cohortNumber = '18';
		var result = cohortData[cohortNumber].graduates >= cohortData[cohortNumber].started_first_shift;
		assert(result);
	});

	it('should show that each cohort should have an array of user objects', function(){
		var cohortNums = Object.keys(cohortData);
		var result = cohortNums.every(cohortHasUserObjects);
		assert(result);
	});

	it('should show that each cohort should have an array of assignment names and IDs', function(){
		var cohortNums = Object.keys(cohortData);
		var result = cohortNums.every(cohortHasAssignmentNamesAndIDs);
		assert(result);
	});
});

function cohortHasUserObjects(cohort){
	return cohortData[cohort].users.length > 0;
}

function cohortHasAssignmentNamesAndIDs(cohort){
	return cohortData[cohort].assignmentNamesAndIDs.length > 0;
}