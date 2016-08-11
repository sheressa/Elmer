'use strict';
var api = require('./helpers/base.js');

var assert = require('assert');
  var retrieveAndRenderShiftsToDelete = require(CONFIG.root_dir + '/www/scheduling/shifts/controllers/retrieveAndRenderShiftsToDelete');

describe('retrieveAndRenderShiftsToDelete should retrieve shifts and render them when user navigates to shift deletion page', function() {

  describe('Shift retrieval for a user', function() {

    it('should retrieve shifts belonging to a user', function (done) {

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
          assert.equal(templateData.regularShifts.length, 2);
          done();
        }
      };

      retrieveAndRenderShiftsToDelete(request, response, api);

    });

    it('should give a 403 (access denied) if helper validation fails', function (done) {

      // Dummy express request object
      var request = {
        query: {
          email: 'test@test.com',
          token: 'x'
        }
      };

      // Dummy Express response object
      var response = {
        status: function(code) {
          assert.equal(code, 403);
          return this;
        },
        send: function(message) {
          assert.equal(message, 'Access denied.');
          done();
        }
      };
      retrieveAndRenderShiftsToDelete(request, response, api);
    });

    it('should sort regularShifts by when they occur on the weekly calendar', function (done) {
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
          assert.equal(code, 403);
          return this;
        },
        render: function(routeToRender, templateData) {
          assert.equal(templateData.regularShifts[0].id, 277119037);
          done();
        }
      };
      retrieveAndRenderShiftsToDelete(request, response, api);
    });

    it('should sort makeupShifts by when they occur on the weekly calendar', function (done) {

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
          assert.equal(code, 403);
          return this;
        },
        render: function(routeToRender, templateData) {
          assert.equal(templateData.makeupShifts[1].id, 281883880);
          done();
        }
      };
      retrieveAndRenderShiftsToDelete(request, response, api);
    });
  });
});