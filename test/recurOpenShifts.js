var assert = require('assert');
var moment = require('moment-timezone');
var now = moment().minute(0).second(0);
var targetTime = moment("2016-06-03T12:00:00.176Z");
var oddHourTargetTime = moment("2016-06-03T11:00:00.176Z");
var recurOpenShifts = require('../jobs/scheduling/RecurOpenShifts.js');
var eventEmitter = require('../jobs/scheduling/RecurOpenShifts.js').eventEmitter;
var result;

describe('recurOpenShifts', function() {

    it('should accurately find the number of open shifts', function (done) {
      eventEmitter.on('recurOpenShiftsData', testData);
      function testData(data) {
        result = data;
        assert.equal(result.countOfOpenShifts, 6);
        eventEmitter.removeAllListeners('recurOpenShiftsData');
      }
      recurOpenShifts.recurOpenShifts(targetTime);
      done();
    });

    it('should accurately find the number of occupied shifts', function (done) {
      eventEmitter.on('recurOpenShiftsData', testData);
      function testData(data) {
        result = data;
        assert.equal(result.countOfOccupiedShifts, 6);
        eventEmitter.removeAllListeners('recurOpenShiftsData');
      }
      recurOpenShifts.recurOpenShifts(targetTime);
      done();
    });

    it('should find the number of extra open shifts to delete', function (done) {
      eventEmitter.on('recurOpenShiftsData', testData);
      function testData(data) {
        result = data;
        assert.equal(result.extraOpenShiftsToDelete[0], 284948049);
        eventEmitter.removeAllListeners('recurOpenShiftsData');
      }
      recurOpenShifts.recurOpenShifts(targetTime);
      done();
    });

    it('should return max open shift count for a time', function (done) {
      result = recurOpenShifts.returnMaxOpenShiftCountForTime(targetTime);
      assert.equal(result, 13);
      done();
    });

    it('should increment future open shifts up or down', function (done) {
      result = recurOpenShifts.incrementFutureOpenShiftsUpOrDown([284948049, 284948019, 284948039, 284948029], 6, 2, targetTime);
      assert.equal(result[0].params.instances, 6);
      done();
    });

    it('should abort if running at an odd hour', function (done) {
      result = recurOpenShifts.recurOpenShifts(oddHourTargetTime);
      assert.equal(result, 'running at an odd hour. abort.');
      done();
    });

});