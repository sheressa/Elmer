'use strict';

const assert = require('assert');
const cohortPromise = require('../jobs/training/meltedDataDump.js').cohortDataPromise;

var cohortData;
before(function(){
	this.timeout(50000);
	return cohortPromise.then(function(data){
		cohortData = data;
	});
});

describe('data valid', function(){
	it('should have 4 data metrics', function(){
		var cohortNumber = '15';
		var result = Object.keys(cohortData[cohortNumber]).length === 4;
		assert(result);
	});

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
