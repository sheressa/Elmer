//deNocked, now we need to 
// - create  a dedicated, static, WiW account that we can query to see if the WiW API is responsive
// - revise these tests to match the WiW test account
// - for now, keep these tests commented out

var WhenIWork = require('wheniwork-unofficial');
var assert = require('assert');

describe('Authentication with wheniwork-unofficial API', function() {

  xit('should return an error if WhenIWork doesn\'t respond with auth token', function(done) {
    var errorResponse = {error: 'Authentication unsuccessful'};
    // Mock response to /login endpoint
    var api = new WhenIWork(KEYS.test.wheniwork.api_key, KEYS.test.wheniwork.username, KEYS.test.wheniwork.password, function(error) {
      if (error.error === errorResponse.error) {
        done();
      }
    });
  });

  xit('should be able to log in and retrieve shifts', function (done) {
    var loginResponse = {
      login: {
        token: 'FAKETOKEN'
      }
    };
    var api = new WhenIWork(KEYS.test.wheniwork.api_key, KEYS.test.wheniwork.username, KEYS.test.wheniwork.password);
    api.get('shifts', function (res) {
      assert.equal(res.ninja, 'turtle');
      done();
    });
  });
});