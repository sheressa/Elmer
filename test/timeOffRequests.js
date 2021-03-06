'use strict';
var assert = require('assert'),
  sampleData = require(CONFIG.root_dir + '/sample_data/sampleData'),
  timeOffRequests = require(CONFIG.root_dir + '/jobs/scheduling/TimeOffRequests');

var requests = sampleData.requestsResponse.requests;
var shiftsResponse = {
  shifts: sampleData.shiftsResponse.shifts.slice(0,4)
};
describe('Time Off Requests', function() {
  describe('Creation of Time Off Search Params', function() {
    it('should create start and end times with the correct format for searching', function () {

      function isValidDate(dateString) {
        var regEx = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/;
        return regEx.test(dateString);
      }

      var timeOffSearchParams = timeOffRequests.createTimeOffSearchParams();
      assert.equal(isValidDate(timeOffSearchParams.start), true);
      assert.equal(isValidDate(timeOffSearchParams.end), true);
    });
  });

  describe('Filter for pending requests only', function() {
    it('should filter an array for requests with status code 0', function () {
      var correctArray = [
        {
          "id": 14790451,
          "account_id": 549781,
          "user_id": 5660404,
          "creator_id": 5660404,
          "updater_id": 5005069,
          "status": 0,
          "type": 0,
          "hours": 0,
          "start_time": "Mon, 06 Jun 2016 00:00:00 -0400",
          "end_time": "Fri, 10 Jun 2016 23:59:59 -0400",
          "created_at": "Sun, 05 Jun 2016 21:31:41 -0400",
          "updated_at": "Sun, 05 Jun 2016 21:35:01 -0400",
          "canceled_by": 0
        },
        {
          "id": 15013196,
          "account_id": 549781,
          "user_id": 5659612,
          "creator_id": 5659612,
          "updater_id": 7889841,
          "status": 0,
          "type": 0,
          "hours": 0,
          "start_time": "Mon, 13 Jun 2016 00:00:00 -0400",
          "end_time": "Mon, 13 Jun 2016 23:59:59 -0400",
          "created_at": "Thu, 09 Jun 2016 09:40:58 -0400",
          "updated_at": "Thu, 09 Jun 2016 09:45:00 -0400",
          "canceled_by": 0
        },
      ];
      assert.deepEqual(timeOffRequests.filterRequestsAndHandleShifts(requests), correctArray);
    });
  });

  describe('Creation of Shift Search Params', function() {
    it('should create correct parameters for get request from time off request ', function () {
      var expectedParams = { 
        start: 'Mon, 06 Jun 2016 00:00:00 -0400',
        end: 'Fri, 10 Jun 2016 23:59:59 -0400',
        "include_objects": false,
        user_id: 5660404,
        location_id: [ 1003765, 1003762 ],
        unpublished: true 
      };

      var shiftSearchParams = timeOffRequests.createShiftSearchParams(requests[1]);
      assert.deepEqual(shiftSearchParams, expectedParams);
    });
  });

  describe('creation of correct batchPayload', function() {
    var requestId = 123456;
    var BatchPayload = timeOffRequests.createBatchPayload (shiftsResponse, requestId);
    var timeOffApprovalRequest = {
      "method": "put",
      "url": "/requests/123456",
      "params": {
        "status": 2
      }
    };

    // Split the Batched Payload into each of the parts it should contain for testing
    var approvalRequest = BatchPayload.shift();
    var deleteRequests = [];
    var openShiftRequests = [];
    BatchPayload.forEach(function(payload, idx) {
      if (idx % 2) {
        openShiftRequests.push(payload);        
      } 
      else {
        deleteRequests.push(payload);
      }
    });

    it('should approve the pending timeoff request', function () {
      assert.deepEqual(approvalRequest, timeOffApprovalRequest);
    });

    it('should create a shiftDeleteRequest for each shift that will be missed', function () {
      deleteRequests.forEach(function(req, idx) {
        assert.equal(req.method, "delete");
        assert.equal(req.url, "/shifts/" + shiftsResponse.shifts[idx].id);
      });
    });

    it('should create new open shifts for all shifts deleted', function () {
      openShiftRequests.forEach(function(req, idx) {
        assert.equal(req.method, "post");
        assert.equal(req.url, "/shifts");
        assert.equal(req.params.start_time, shiftsResponse.shifts[idx].start_time);
        assert.equal(req.params.end_time, shiftsResponse.shifts[idx].end_time);
        assert.equal(req.params.notes, "SHIFT COVERAGE");
        assert.equal(req.params.location_id, CONFIG.locationID.makeup_and_extra_shifts);
      });
    });
  });
});