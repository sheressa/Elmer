'use strict';

var assert = require('assert');
var dropMeltedUsers = require('../jobs/scheduling/dropMeltedUsers.js');
var updateCanvas = require('../jobs/scheduling/helpers/updateCanvas.js');
var WiWUsers = require('../sample_data/sampleData').usersResponse;
var firstMeltInvoluntary = require('../email_templates/firstMeltInvoluntary.js');
var firstMeltVoluntary = require('../email_templates/firstMeltVoluntary.js');
var secondMeltInvoluntary = require('../email_templates/secondMeltInvoluntary.js');
var secondMeltVoluntary = require('../email_templates/secondMeltVoluntary.js'); 
var template1 = firstMeltInvoluntary('John', 'Kaley');
var template2 = firstMeltVoluntary('John', 'Kaley');
var template3 = secondMeltInvoluntary('John', 'Kaley');
var template4 = secondMeltVoluntary('John', 'Kaley');
var user = {
      id: 1734,
      name: "John Rauschenberg",
      sortable_name: "Rauschenberg, John",
      short_name: "John Rauschenberg",
      sis_user_id: "2016060102",
      integration_id: null,
      sis_login_id: "john@crisistextline.org",
      sis_import_id: null,
      login_id: "john@crisistextline.org"
};

describe('drop melted users', function() {

    xit('should find courses in Canvas', function (done) {
      this.timeout(3000)
      var resultIsLong = false;
      updateCanvas.canvas.retrieveCourses()
      .then(function(result) {
        assert.equal(result[0].id, 1);
        if (result.length >= 40) resultIsLong = true;
        assert.equal(resultIsLong, true);
        done();
      });
    });
    //this test fails because user 1734 is no longer 'inactive' in course 60
    xit('should find melted users in Canvas', function (done) {
      var canvasUserID = 1734;
      updateCanvas.canvas.retrieveEnrollment(60, 'inactive')
      .then(function(result) {
        console.log('result ', result)
        assert.equal(result[0].user_id, canvasUserID);
        done();
      });
    });

    xit('should delete the melted user and their shifts from When I Work', function (done) {
      var WiWUserID = 7889841;
      var result = dropMeltedUsers.deleteWiWUserAndShifts({login_id: 'john@crisistextline.org'}, WiWUsers);
      assert.equal(result[0], WiWUserID);
      done();
    });

    it('should email melted users with the first time involuntary melt email', function (done) {
      var message = dropMeltedUsers.emailMeltedUser(user, 1, 'inactive', 'c15kaley');
      assert.equal(message.to[0].email, user.login_id);
      assert.equal(message.html, template1);
      done();
    });

    it('should email melted users with the first time voluntary melt email', function (done) {
      var message = dropMeltedUsers.emailMeltedUser(user, 1, 'completed', 'c15kaley');
      assert.equal(message.to[0].email, user.login_id);
      assert.equal(message.html, template2);
      done();
    });

    it('should email the melted user with the second time involuntary melt email', function (done) {
      var message = dropMeltedUsers.emailMeltedUser(user, 2, 'inactive', 'c15kaley');
      assert.equal(message.to[0].email, user.login_id);
      assert.equal(message.html, template3);
      done();
    });

    it('should email the melted user with the second time voluntary melt email', function (done) {
      var message = dropMeltedUsers.emailMeltedUser(user, 2, 'completed', 'c15kaley');
      assert.equal(message.to[0].email, user.login_id);
      assert.equal(message.html, template4);
      done();
    });

});

