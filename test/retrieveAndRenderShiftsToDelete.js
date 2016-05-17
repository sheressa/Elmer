var nock = require('nock')
  , WhenIWork = require('wheniwork-unofficial')
  , config = require('../config')
  ;

global.config = config // @TODO; A hack which prevents retrieveAndRenderShiftsToDelete from breaking, fix this with a initTest.js file which runs first and puts config in the global scope immediately

var assert = require('assert')
  , sampleData = require('./sampleData')
  , retrieveAndRenderShiftsToDelete = require(config.root_dir + '/www/scheduling/shifts/controllers/retrieveAndRenderShiftsToDelete')
  ;

describe('retrieveAndRenderShiftsToDelete should retrieve shifts and render them when user navigates to shift deletion page', function() {
  var base = nock('https://api.wheniwork.com/2');
  var loginResponse = {
    login: {
      token: 'FAKETOKEN'
    }
  };
  var userEmail = 'amudantest@test.com';
  var userToken = '9365583ac27c52684eb6efb8e9374c04823dce59';

  var api = new WhenIWork(config.wheniwork.api_key, config.wheniwork.username, config.wheniwork.password);

// https://api.wheniwork.com/2/users?

  it('should retrieve shifts belonging to a user', function (done) {
    base
      .get('/users')
      .query(true)
      .reply(200, {users: [sampleData.user]});

    base
      .get('/shifts')
      // If just the userID matches the query, then we'll return the sample data. (In real life, we'd need to get the time frame of the shifts we want to retrieve, among other things.)
      .query(function(actualQueryObject) {
        if (actualQueryObject.user_id == sampleData.user.id) return true;
        else return false;
      })
      .reply(200, sampleData.shifts);

    // Dummy express request object
    var request = {
      query: {
        email: userEmail,
        token: userToken
      }
    }

    // Dummy Express response object
    var response = {
      status: function(code) {
        console.log('Response code: ' + code);
      },

      render: function(routeToRender, templateData) {
        if (templateData.regularShifts.length > 0) {
          done();
        }
      }
    };

    retrieveAndRenderShiftsToDelete(request, response, api)
  });
});

