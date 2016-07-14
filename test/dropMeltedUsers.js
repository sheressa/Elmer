var assert = require('assert');
var dropMeltedUsers = require('../jobs/scheduling/dropMeltedUsers.js');
var updateCanvas = require('../jobs/scheduling/helpers/updateCanvas.js');
var WiWUsers = require('../sample_data/sampleData').usersResponse;

describe('drop melted users', function() {

    it('should find courses in Canvas', function (done) {
      var resultIsLong = false;
      updateCanvas.canvas.retrieveCourses()
      .then(function(result) {
        assert.equal(result[0].id, 1);
        if (result.length >= 40) resultIsLong = true;
        assert.equal(resultIsLong, true);
        done();
      });
    });

    it('should find melted users in Canvas', function (done) {
      var canvasUserID = 1734;
      updateCanvas.canvas.retrieveEnrollment(60, 'inactive')
      .then(function(result) {
        assert.equal(result[0].user_id, canvasUserID);
        done();
      });
    });

    it('should delete the melted user and their shifts from When I Work', function (done) {
      var WiWUserID = 7889841;
      var result = dropMeltedUsers.deleteWiWUserAndShifts({login_id: 'john@crisistextline.org'}, WiWUsers);
      assert.equal(result[0], WiWUserID);
      done();
    });

});

