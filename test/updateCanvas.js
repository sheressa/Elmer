var assert = require('assert');
var updateCanvas = require('../jobs/scheduling/updateCanvas.js');
var WiWUser = [7889841];
var canvasUser = 1734;

describe('update Canvas', function() {

    it('gives a user a passing grade in Canvas on the "Schedule Your Shifts" assignment', function (done) {
      updateCanvas.updateUserGradeInCanvas(canvasUser, 60, 921)
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
      updateCanvas.canvas.scrapeCanvasUsers('John Rauschenberg')
      .then(function(result) {
        assert.equal(result[0].id, 1734);
        done();
      });
    });

    it('can scrape Canvas to find assignments in a course matching a filter', function (done) {
      updateCanvas.canvas.scrapeCanvasAssignments(60, 'Schedule Your Shifts')
      .then(function(result) {
        assert.equal(result[0].id, 921);
        done();
      });
    });

});

