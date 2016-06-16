var checkUser = require('../www/scheduling/index.js');
var assert = require('assert');

describe('Login and user creation', function () {

    it('Doesn\'t create a user that already exists', function(done) {
      checkUser.checkUser('amudantest@test.com', 'Amudan', 'Test', function(user) {
        assert.equal(user.email, 'amudantest@test.com');
      });
      done();
    });

    it('Creates a new user if one doesn\'t exist', function(done) {
      var result = checkUser.checkUser('test@test.com', 'Testy', 'McTesterson', function(user) {});
      assert.equal(result.first_name, 'Testy');
      done();
    });

});
