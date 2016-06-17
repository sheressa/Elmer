var assert = require('assert');
var getTimezones = require('../www/scheduling/index.js');

describe('Timezones controller should render the timezone confirmation page', function() {
  
  it('should return data if email and token match', function(done) {
    var email = 'test@crisistextline.org';
    var token = '14d82662d4e5fd650f14135930f982c1bfb3bfd9';
    var data = {query: {email: email, token: token}};

    var response = {render: function(url, obj) {
      assert.equal(obj.timezones[9], 'Eastern');
      done();
    }};

    getTimezones.getTimezones(data, response);

  });

  it('should return full data if email and token match', function(done) {
    var email = 'test@crisistextline.org';
    var token = '14d82662d4e5fd650f14135930f982c1bfb3bfd9';
    var data = {query: {email: email, token: token}};

    var response = {render: function(url, obj) {
      assert.equal(obj.timezones[15], 'Pacific');
      done();
    }};

    getTimezones.getTimezones(data, response);

  });

  it('should error out if email and token do not match', function(done) {
    var email = 'test@crisistextline.org';
    var token = 'badtoken';
    var data = {query: {email: email, token: token}};

    var response = {
      status: function(code) {
        assert.equal(code, 403);
        return this;
      }, 
      send: function(code) {
        done();
      }
      };

    getTimezones.getTimezones(data, response);

  });

});