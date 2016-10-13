'use strict';

var assert = require('assert');
var dropMeltedUsers = require('../jobs/scheduling/dropMeltedUsers.js');
var WiWUsers = require('../sample_data/sampleData').usersResponse;

describe('drop melted users', function() {

    it('should delete the melted user and their shifts from When I Work', function (done) {
      var WiWUserID = 7889841;
      var result = dropMeltedUsers.deleteWiWUserAndShifts({login_id: 'john@crisistextline.org'}, WiWUsers);
      assert.equal(result[0], WiWUserID);
      done();
    });

});

