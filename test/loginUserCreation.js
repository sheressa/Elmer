'use strict';

var checkUser = require('../www/scheduling/index.js').checkUser;
var assert = require('assert');

describe('Login and user creation', function () {

    it('Doesn\'t create a user that already exists', function(done) {
      this.timeout(4000);
      checkUser('amudantest@test.com', 'Amudan', 'Test', function(user) {
        assert.equal(user.email, 'amudantest@test.com');
        done();
      });
    });
    it('Reactivates a deleted user if one exists', function(done) {
      checkUser('deleted@test.com', 'Del', 'Eted', function(user) {
        assert.equal(user.email, 'deleted@test.com');
        done();
      });
    });
    it('Creates a new user if one doesn\'t exist deleted or active', function(done){
      checkUser('amylee@evanescence.com', 'Amy', 'Lee', function(user){
        assert.equal(user, 'amylee@evanescence.com');
        done();
      });
    });
});
