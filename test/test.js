var nock = require('nock');
var WhenIWork = require('wheniwork-unofficial');
var config = require('../config');
var assert = require('assert');

var base = nock('https://api.wheniwork.com/2');
var loginResponse = {
  login: {
    token: 'FAKETOKEN'
  }
};

base.post('/login').reply(200, loginResponse);

it('should log in and get shifts', function (done) {
  var api = new WhenIWork(config.wheniwork.api_key, config.wheniwork.username, config.wheniwork.password);
  base.get('/shifts?').reply(200, {ninja: 'turtle'});

  api.get('shifts', function (res) {
    assert.equal(res.ninja, 'turtle');
    done();
  });
});
