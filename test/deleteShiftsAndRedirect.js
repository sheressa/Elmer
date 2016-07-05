var api = require('./helpers/base.js');
var assert = require('assert')
  , sampleData = require('./sampleData')
  var deleteShiftsAndRedirect = require(CONFIG.root_dir + '/www/scheduling/shifts/controllers/deleteShiftsAndRedirect')
  ;
describe('delete shifts and redirect', function() {
  var userEmail = 'amudantest@test.com';
  var userToken = '9365583ac27c52684eb6efb8e9374c04823dce59';

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
      var response = {
        status: function(code) {
          return this;
        },

        json: function(response) {
        },

        send: function(message) {
          assert.equal(message, 'Access denied.');
          done();
        },

        render: function(routeToRender, templateData) {
          if (templateData.regularShifts.length > 0) {
            done();
          }
        }
      };

      deleteShiftsAndRedirect(request, response, api);
    });

    it('finds a regular shift to be deleted', function (done) {

      // Dummy express request object
      var request = {
        query: {
          email: userEmail,
          token: userToken,
          regShift284947012: 'on'
        }
      };
      // Dummy Express response object
      var response = {
        status: function(code) {
          console.log('Response code: ' + code);
          return this;
        },

        json: function(response) {
          assert.equal(response.redirect, '/scheduling/shifts/delete-success?deletedShiftInformation={"regShifts":{},"makShifts":{}}&email=amudantest%40test.com&token=9365583ac27c52684eb6efb8e9374c04823dce59&url=https://app.wheniwork.com/&');
          done();
        },

        send: function(message) {
          assert.equal(message, 'Access denied.');
          done();
        },

        render: function(routeToRender, templateData) {
          if (templateData.regularShifts.length > 0) {
            done();
          }
        }
      };

      deleteShiftsAndRedirect(request, response, api);
    });

    it('finds a makeup shift to be deleted', function (done) {

      // Dummy express request object
      var request = {
        query: {
          email: userEmail,
          token: userToken,
          makShift284947012: 'on'
        }
      };
      // Dummy Express response object
      var response = {
        status: function(code) {
          console.log('Response code: ' + code);
          return this;
        },

        json: function(response) {
          assert.equal(response.redirect, '/scheduling/shifts/delete-success?deletedShiftInformation={"regShifts":{},"makShifts":{}}&email=amudantest%40test.com&token=9365583ac27c52684eb6efb8e9374c04823dce59&url=https://app.wheniwork.com/&');
          done();
        },

        send: function(message) {
          assert.equal(message, 'Access denied.');
          done();
        },

        render: function(routeToRender, templateData) {
          if (templateData.regularShifts.length > 0) {
            done();
          }
        }
      };
      deleteShiftsAndRedirect(request, response, api);
    });
  });
});