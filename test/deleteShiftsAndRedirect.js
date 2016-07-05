global.KEYS = require('../keys.js');
global.CONFIG = require('../config.js');

var api = require('./helpers/base.js'),
  assert = require('assert'), 
  sampleData = require('../sample_data/sampleData.js'),
  deleteShiftsAndRedirect = require(CONFIG.root_dir + '/www/scheduling/shifts/controllers/deleteShiftsAndRedirect')
  ;
describe('delete shifts and redirect', function() {
  var userEmail = 'amudantest@test.com';
  var userToken = '9365583ac27c52684eb6efb8e9374c04823dce59';
  // Dummy Express response object
  var response = {
    status: function(code) {
      console.log('Response code: ' + code);
      return this;
    },
    json: function(response) {
    }
  };
  var request = {
    query: {
      email: userEmail,
      token: 'x'
    }
  };

  describe('shift deletion', function() {

    it('should send a 403 if email and token are not valid', function (done) {

      // Dummy express request object
      var request = {
        query: {
          email: userEmail,
          token: 'x'
        }
      };
      // Dummy Express response object
        response.send =  function(message) {
          assert.equal(message, 'Access denied.');
          done();
        };
      deleteShiftsAndRedirect(request, response, api);
    });

    it('finds a regular shift to be deleted', function (done) {

      // Dummy express request object
       request.query.token = userToken,
       request.query.regShift284947012 = 'on';
      // Dummy Express response object
        response.json =  function(response) {
          assert.equal(response.redirect, '/scheduling/shifts/delete-success?deletedShiftInformation={"regShifts":{},"makShifts":{}}&email=amudantest%40test.com&token=9365583ac27c52684eb6efb8e9374c04823dce59&url=https://app.wheniwork.com/&');
          done();
        };

        response.send =  function(message) {
          assert.equal(message, 'Access denied.');
          done();
        };
      deleteShiftsAndRedirect(request, response, api);
    });

    it('finds a makeup shift to be deleted', function (done) {

      // Dummy express request object
        request.query.token = userToken,
        request.query.makShift281883880 = 'on';
      // Dummy Express response object
        response.json =  function(response) {
          assert.equal(response.redirect, '/scheduling/shifts/delete-success?deletedShiftInformation={"regShifts":{},"makShifts":{"281883880":{"start_time":"Thursday, Jan 28th 2016 - 4:00 pm","end_time":"6:00 pm EST"}}}&email=amudantest%40test.com&token=9365583ac27c52684eb6efb8e9374c04823dce59&url=https://app.wheniwork.com/&');
          done();
        };

        response.send = function(message) {
          assert.equal(message, 'Access denied.');
          done();
        };
      deleteShiftsAndRedirect(request, response, api);
    });
  });
});