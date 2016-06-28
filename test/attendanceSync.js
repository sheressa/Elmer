var assert = require('assert'),
	attendance = require(CONFIG.root_dir + '/jobs/scheduling/AttendanceSync.js'),
	GTWSampleUsers = require('./GTWsampleData.js').userArr,
	GTWsampleResp = require('./GTWsampleData.js').userRes;

describe('GTW integration with Canvas grading', function(){

	describe('urlTime', function(){
		it('urlTime returns url-friendly 72 hour time interval object', function(done){
			var time = attendance.urlTime();
			var start = (new Date()).toJSON().toString().slice(0,19)+'Z';
			var re = new RegExp(':', 'ig');
			start = start.replace(re, '%3A');
			assert.equal(start, time.endDate);
			done();
		});
	});

	describe("checkForDupUsersInGTWFilterForThoseWhoAttendedLessThan90Mins", function(){
		//the function being tested was exported as 'processor' because the alternative has more letters than nyc has people

		it("removes duplicates", function(done){
			var result = attendance.processor(GTWSampleUsers);
			assert.equal("justo@nisiAeneaneget.co.uk", result[1].email);
			done();

		});

		it("filters for users who've attended for 90 minutes or more", function(done){
			var result = attendance.processor(GTWSampleUsers);
			assert.equal(6, result.length);
			done();

		});

		it("adds up attendance time correctly", function(done){
			var result = attendance.processor(GTWSampleUsers);
			assert.equal(5840, result[4].attendance);
			done();

		});

		it('works with one user', function(done){
			var userSample = [{
			"firstName": "Teegan",
			"lastName": "Buchanan",
			"attendanceTimeInSeconds": 5602,
			"email": "ipsum.sodales.purus@malesuadavelconvallis.com"
			}];
			var result = attendance.processor(userSample);
			assert.equal('Teegan', result[0].firstName);
			done();
		});
	});
});