var nock = require('nock');
var WhenIWork = require('wheniwork-unofficial');
var config = require('../config');
var assert = require('assert');

describe('Authentication with wheniwork-unofficial API', function() {
  var base = nock('https://api.wheniwork.com/2');

  it('should return an error if WhenIWork doesn\'t respond with auth token', function(done) {
    var errorResponse = {error: 'Authentication unsuccessful'};
    // Mock response to /login endpoint
    base.post('/login').reply(501, errorResponse);
    var api = new WhenIWork(config.wheniwork.api_key, config.wheniwork.username, config.wheniwork.password, function(error) {
      if (error.error === errorResponse.error) {
        done();
      }
    });
  });

  it('should be able to log in and retrieve shifts', function (done) {
    var loginResponse = {
      login: {
        token: 'FAKETOKEN'
      }
    };
    base.post('/login').reply(200, loginResponse);
    base.get('/shifts?').reply(200, {ninja: 'turtle'});
    var api = new WhenIWork(config.wheniwork.api_key, config.wheniwork.username, config.wheniwork.password);
    api.get('shifts', function (res) {
      assert.equal(res.ninja, 'turtle');
      done();
    });
  });
});
