'use strict';
//this file will be rewritten with a mock canvas api; don't uncomment out tests yet

var assert = require('assert');
var updateCanvas = require('../jobs/scheduling/helpers/updateCanvas.js');
var WiWUser = [7889841];
var canvasUser = 1734;
var trainingCourseID = 49;
var scheduleYourShiftsAssignmentID = 676;

xdescribe('update Canvas', function() {

    it('gives a user a passing grade in Canvas on the "Schedule Your Shifts" assignment', function (done) {
      this.timeout(3000)
      updateCanvas.canvas.updateUserGrade(canvasUser, trainingCourseID, scheduleYourShiftsAssignmentID, 'complete')
      .then(function(result) {
        assert.equal(result.grade, 'complete');
        done();
      });
    });

    it('can scrape Canvas to find courses a user is enrolled in', function (done) {
      updateCanvas.canvas.scrapeCanvasEnrollment(canvasUser)
      .then(function(result) {
        assert.equal(result[0].course_id, 60);
        done();
      });
    });

    it('can scrape Canvas to match a WiW user to a Canvas user', function (done) {
      updateCanvas.canvas.scrapeCanvasUsers('john@crisistextline.org')
      .then(function(result) {
        assert.equal(result[0].id, 1734);
        done();
      });
    });

    it('can scrape Canvas to find assignments in a course matching a filter', function (done) {
      this.timeout(3000)
      updateCanvas.canvas.scrapeCanvasAssignments(trainingCourseID, 'Schedule Your Shifts')
      .then(function(result) {
        assert.equal(result[0].id, scheduleYourShiftsAssignmentID);
        done();
      });
    });

});

