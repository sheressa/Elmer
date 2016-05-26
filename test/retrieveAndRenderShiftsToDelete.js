var nock = require('nock')
  , WhenIWork = require('wheniwork-unofficial')
  , config = require('../config')
  ;

global.config = config // @TODO; A hack which prevents retrieveAndRenderShiftsToDelete from breaking, fix this with a initTest.js file which runs first and puts config in the global scope immediately

var assert = require('assert')
  , sampleData = require('./sampleData')
  , retrieveAndRenderShiftsToDelete = require(config.root_dir + '/www/scheduling/shifts/controllers/retrieveAndRenderShiftsToDelete');

describe('retrieveAndRenderShiftsToDelete should retrieve shifts and render them when user navigates to shift deletion page', function() {
  var api = new WhenIWork(config.wheniwork.api_key, config.wheniwork.username, config.wheniwork.password);

  // Set up the API mock to send back data that we can pass in to our test.
  beforeEach(function() {
    console.log('running setup stuff in beforeEach');

    var apiMocker = nock('https://api.wheniwork.com/2')
          .get('/users')
          .query(true)
          .reply(200, {users: [sampleData.user]});

    var apiMocker2 = nock('https://api.wheniwork.com/2')
          .get('/shifts')
          // If just the userID matches the query, then we'll return the sample data. (In real life, we'd need to get the time frame of the shifts we want to retrieve, among other things.)
          .query(function(actualQueryObject) {
            if (actualQueryObject.user_id == sampleData.user.id) return true;
            else return false;
          })
          .reply(200, sampleData.shifts);
  });

  describe('Shift retrieval for a user', function() {

    it('should retrieve shifts belonging to a user', function (done) {
      // var api = nock('https://api.wheniwork.com/2');

      // Dummy express request object
      var request = {
        query: {
          email: 'amudantest@test.com',
          token: '9365583ac27c52684eb6efb8e9374c04823dce59'
        }
      };

      // Dummy Express response object
      var response = {
        status: function(code) {
          console.log('Response code: ' + code);
        },

        render: function(routeToRender, templateData) {
          assert.equal(templateData.regularShifts.length, 4);
          done();
        }
      };

      retrieveAndRenderShiftsToDelete(request, response, api);

    });

  });

});
