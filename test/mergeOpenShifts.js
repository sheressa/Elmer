var WhenIWork = require('wheniwork-unofficial');

var assert = require('assert')
  , sampleData = require('./sampleData');
var mergeOpenShiftsExportObject = require(global.config.root_dir + '/jobs/scheduling/MergeOpenShifts.js');

describe('merge open shifts', function() {

  var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

  describe('batch payload creation', function() {

    it('adds open regular and makeup shifts to batch', function (done) {
      var result = mergeOpenShiftsExportObject.processDataAndMakeMergeAPICalls(sampleData.shifts);
      var putRequests = 0;
      var deleteRequests = 0;

      result.forEach(function(shift) {
        if (shift.method === 'PUT' && shift.params.instances === 2) {
          putRequests ++;
        } else if (shift.method === 'delete') {
          deleteRequests ++;
        }
      });

      if (putRequests === 2 && deleteRequests === 2) {
        done();
      }

    });

    it('does not merge shifts at different times', function (done) {
      var result = mergeOpenShiftsExportObject.processDataAndMakeMergeAPICalls(sampleData.separateShifts);
      var putRequests = 0;
      var deleteRequests = 0;

      result.forEach(function(shift) {
        if (shift.method === 'PUT' && shift.params.instances === 2) {
          putRequests ++;
        } else if (shift.method === 'delete') {
          deleteRequests ++;
        }
      });

      if (putRequests === 0 && deleteRequests === 0) {
        done();
      }

    });

  });

});

