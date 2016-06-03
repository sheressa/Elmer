var checkUser2 = require('../www/scheduling/controllers/loginUserCreation.js');
var sampleData = require('./sampleData.js');
var assert = require('assert');
var nock = require('nock');

var newUser = {
            role: 3,
            email: 'test@test.com',
            first_name: 'Testy',
            last_name: 'McTesterson',
            activated: true,
            locations: [global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts],
            password: global.config.wheniwork.default_password,
            notes: JSON.stringify({ canonicalEmail: 'test@test.com' })
          };

describe('Login and user creation', function () {

  beforeEach(function() {
    var apiMocker = nock('https://api.wheniwork.com/2')
          .get('/users')
          .query(true)
          .reply(200, {users: [sampleData.user]});

    var apiMocker2 = nock('https://api.wheniwork.com/2')
          .post('/users')
          .query(true)
          .reply(203, newUser);

  });

  describe('checkUser function', function() {

    it('Doesn\'t create a user that already exists', function() {
      checkUser2('amudantest@test.com', 'Amudan', 'Test', function(user) {
        assert.equal(user.email, 'amudantest@test.com');
      });
    });

    it('Creates a new user if one doesn\'t exist', function() {
      var apiMocker3 = nock('https://api.wheniwork.com/2')
        .post('/login')
        .query(true)
        .reply(203, {});
      checkUser2('test@test.com', 'Testy', 'McTesterson', function(user) {
        assert.equal(user.email, 'test@test.com');
      });
    });

  });

});
