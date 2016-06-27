var assert = require('assert');
var dropMeltedUsers = require('../jobs/scheduling/dropMeltedUsers.js');
var canvasUser = { id: 1734,
       name: 'John Rauschenberg',
       sortable_name: 'Rauschenberg, John',
       short_name: 'John Rauschenberg',
       sis_user_id: '2016060102',
       integration_id: null,
       sis_login_id: 'john@crisistextline.org',
       sis_import_id: null,
       login_id: 'john@crisistextline.org' };

describe('drop melted users', function() {

    it('should find all courses in Canvas', function (done) {
      dropMeltedUsers.canvas.scrapeCanvasCourses()
      .then(function(result) {
        assert.equal(result[0].id, 1);
        done();
      });
    });

    it('should find melted users in Canvas', function (done) {
      dropMeltedUsers.canvas.scrapeCanvasEnrollment(60, 'inactive')
      .then(function(result) {
        assert.equal(result[0].user_id, 1734);
        done();
      });
    });

    it('should delete the melted user and their shifts from When I Work', function (done) {
      var result = dropMeltedUsers.deleteWiWUserAndShifts({login_id: 'john@crisistextline.org'});
      assert.equal(result[0], 7889841);
      done();
    });

    it('should email the melted user', function (done) {
      var result = dropMeltedUsers.canvas.emailDroppedUser(canvasUser);
      assert.equal(result.subject, 'Melted');
      done();
    });

});

