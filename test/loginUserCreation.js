'use strict';

global.KEYS = require('../keys.js');
global.CONFIG = require('../config.js')

var checkUser = require('../www/scheduling/index.js').checkUser;
var assert = require('assert');

describe('Login and user creation', function () {

    it('Doesn\'t create a user that already exists', function(done) {
      this.timeout(4000);
      checkUser('amudantest@test.com', 'Amudan', 'Test', function(user) {
        console.log('user email ',user.email)
        assert.equal(user.email, 'amudantest@test.com');
        done();
      });
    });
    //this test can't be run more than once; we can only create a new user once, afterwards it's an existing user. if we delete that user, it will just be an existing deleted user and the new version of the login script will just reactivate that user
    // xit('Creates a new user if one doesn\'t exist', function(done) {
    //   this.timeout(4000);
    //   checkUser('test2@test.com', 'Testy2', 'McTesterson2', function(user) {
    //     assert.equal(user, 'test2@test.com');
    //     done();
    //   });
    // });
});
