'use strict';

const assert = require('assert');
const cohortPromise = require('../jobs/training/meltedDataDumpToSlack.js').cohortDataPromise;

var cohortData;
before(function(){
	this.timeout(60000);
// TODO Is this going to cause the data to be posted to slack everytime we run tests? 
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

	it('should show that the amount of people who graduated is at least the amount who started their first shift', function(	){
		var cohortNumber = '18';
		var result = cohortData[cohortNumber].graduates >= cohortData[cohortNumber].started_first_shift;
		assert(result);
	});
});
