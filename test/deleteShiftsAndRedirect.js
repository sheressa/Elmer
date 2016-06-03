var nock = require('nock'), 
    WhenIWork = require('wheniwork-unofficial');

var assert = require('assert')
  , sampleData = require('./sampleData')
  var deleteShiftsAndRedirect = require(global.CONFIG.root_dir + '/www/scheduling/shifts/controllers/deleteShiftsAndRedirect')
  ;
describe('delete shifts and redirect', function() {
  var base = nock('https://api.wheniwork.com/2');
  var userEmail = 'amudantest@test.com';
  var userToken = '9365583ac27c52684eb6efb8e9374c04823dce59';

  beforeEach(function() {

    var apiMocker = nock('https://api.wheniwork.com/2')
          .get('/shifts')
          .query(true)
          .reply(200, {shifts: [sampleData.shifts]});

    var apiMocker2 = nock('https://api.wheniwork.com/2')
          .post('/batch', {})
          .query(true)
          .reply(203, {});

  });

  var api = new WhenIWork(global.KEYS.test.wheniwork.api_key, global.KEYS.test.wheniwork.username, global.KEYS.test.wheniwork.password);

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

