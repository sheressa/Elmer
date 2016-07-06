var checkUser = require('../www/scheduling/index.js').checkUser;
var assert = require('assert');

describe('Login and user creation', function () {

    it('Doesn\'t create a user that already exists', function(done) {
      this.timeout(5000);
      checkUser('amudantest@test.com', 'Amudan', 'Test', function(user) {
        assert.equal(user.email, 'amudantest@test.com');
        done();
      });
    });

    it('Creates a new user if one doesn\'t exist', function(done) {
      this.timeout(5000);
      checkUser('test2@test.com', 'Testy2', 'McTesterson2', function(user) {
        assert.equal(user, 'test2@test.com');
        done();
      });
    });

});
