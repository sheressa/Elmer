var assert = require('assert');
var processUsers = require('../jobs/scheduling/NotifyFirstShift.js');
var sampleData = require(CONFIG.root_dir + '/test/sampleData');
var result = processUsers(sampleData.usersResponse.users);

describe('notifyFirstShift', function() {

    it('creates an update post to users with correct message', function (done) {

      assert.equal(result[0].message.subject, 'Welcome aboard!');
      done();

    });

    it('creates an update post to users with correct user ID', function (done) {

      assert.equal(result[0].user, 5674723);
      done();

    });

    it('creates an update post to users with correct notes', function (done) {

      assert.equal(result[0].notes, '{"original_owner":5674723, "parent_shift":277119256}');
      done();

    });

    it('does not create an update post to users if the user creation date is out of range', function (done) {
      
      var failedTest = false;
      for (var i = 0; i<result.length; i++) {
        if (result[i].user === 5674724) failedTest = true;
      }
      assert.equal(failedTest, false);
      done();

    });

});

