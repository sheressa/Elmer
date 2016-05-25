var timezone = require('../www/scheduling/controllers/timezone.js')
var assert = require('assert');

describe('Timezones', function () {
  describe('Timezones controller should render the timezone confirmation page', function() {
    it('should return data if email and token match', function() {
      var email = 'test@crisistextline.org';
      var token = '14d82662d4e5fd650f14135930f982c1bfb3bfd9';
      var data = {query: {email: email, token: token}};
      var result = timezone(data);
      assert.equal(result[9], 'Eastern');
    })
    it('should return full data if email and token match', function() {
      var email = 'test@crisistextline.org';
      var token = '14d82662d4e5fd650f14135930f982c1bfb3bfd9';
      var data = {query: {email: email, token: token}};
      var result = timezone(data);
      assert.equal(result[15], 'Pacific');
    })
    it('should error out if email and token do not match', function() {
      var email = 'test@crisistextline.org';
      var token = 'x';
      var data = {query: {email: email, token: token}};
      var result = timezone(data);
      assert.equal(result, 403);
    })

  });

});

