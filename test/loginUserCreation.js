global.KEYS = require('../keys.js');
global.CONFIG = require('../config.js');
// PROBLEM PROBLEM 
var checkUser = require('../www/scheduling/index.js').checkUser;
var assert = require('assert');

describe('Login and user creation', function () {

    it('Doesn\'t create a user that already exists', function(done) {
      checkUser('amudantest@test.com', 'Amudan', 'Test', function(user) {
        assert.equal(user.email, 'amudantest@test.com');
      });
      done();
    });

    it('Creates a new user if one doesn\'t exist', function(done) {
      var result = checkUser('test@test.com', 'Testy', 'McTesterson', function(user) {});
      console.log('result ', result)
      assert.equal(result.first_name, 'Testy');
      done();
    });

});
