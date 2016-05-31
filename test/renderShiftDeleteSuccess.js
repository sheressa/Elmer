var assert = require('assert')
  , sampleData = require('./sampleData')
  var renderShiftDeleteSuccess = require(global.config.root_dir + '/www/scheduling/shifts/controllers/renderShiftDeleteSuccess')
  ;

describe('render successful shift deletion', function() {
  var userEmail = 'amudantest@test.com';
  var userToken = '9365583ac27c52684eb6efb8e9374c04823dce59';
  var userName = 'amudantest@test.com';
  var deletedShiftInformation = '{"regShifts": {"a" : 4}, "makShifts": {"b" : 3}}';

  describe('shift deletion', function() {

    it('adds a regular shift to cancelled shifts and renders success page', function (done) {
      // Dummy express request object
      var request = {
        query: {
          email: userEmail,
          token: userToken,
          userName: userName,
          regShift284947012: 'on',
          deletedShiftInformation: deletedShiftInformation
        }
      };
      // Dummy Express response object
      var response = {
        render: function(routeToRender, templateData) {
          if (routeToRender === 'scheduling/someShiftsCancelled' && templateData.regShifts.length > 0) {
            done();
          }
        }
      };
      renderShiftDeleteSuccess(request, response);
    });

    it('adds a makeup shift to cancelled shifts and renders success page', function (done) {
      // Dummy express request object
      var request = {
        query: {
          email: userEmail,
          token: userToken,
          userName: userName,
          makShift284947012: 'on',
          deletedShiftInformation: deletedShiftInformation
        }
      };
      // Dummy Express response object
      var response = {
        render: function(routeToRender, templateData) {
          if (templateData.makShifts.length > 0) {
            done();
          }
        }
      };
      renderShiftDeleteSuccess(request, response);
    });
  });
});

