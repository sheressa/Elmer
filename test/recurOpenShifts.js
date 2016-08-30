/* globals describe, it */ 
'use strict';

const assert = require('assert');
const moment = require('moment-timezone');
const targetTime = moment('2016-06-03T12:00:00.176Z');
const oddHourTargetTime = moment('2016-06-03T11:00:00.176Z');
const recurOpenShifts = require('../jobs/scheduling/RecurOpenShifts.js');
const testShifts = require('../sample_data/sampleData').shiftsResponse;

describe('recurOpenShifts', function() {

  describe('tallyOccupiedAndOpenShifts', function() {

    const [extraOpenShiftsToDelete, countOfOccupiedShifts, countOfOpenShifts] = recurOpenShifts.tallyOccupiedAndOpenShifts(testShifts);

    it('should accurately find the number of open shifts', function () {
      assert.equal(countOfOccupiedShifts, 7);
    });

    it('should accurately find the number of occupied shifts', function () {
      assert.equal(countOfOpenShifts, 6);
    });

    it('should find extra open shifts to delete', function () {
      assert.deepEqual(extraOpenShiftsToDelete, [ 284948049, 284948019, 284948039, 284948029, 284948099, 284948199 ]);
    });

  });

  describe('returnMaxOpenShiftCountForTime', function() {

    it('should return max open shift count for a time', function () {
      assert.equal(recurOpenShifts.returnMaxOpenShiftCountForTime(targetTime), 9);
    });

  });

  describe('incrementFutureOpenShiftsUpOrDown', function() {

    const result = recurOpenShifts.incrementFutureOpenShiftsUpOrDown([284948049, 284948019, 284948039, 284948029], 6, 2, targetTime);
    
    it('should increment future open shifts up or down', function () {
      assert.equal(result[0].params.instances, 6);
      assert.deepEqual(result[4], { method: 'delete', url: '/shifts/284948029', params: {} });
    });

  });

  it('should abort if running at an odd hour', function () {
    assert.equal(recurOpenShifts.checkTime(oddHourTargetTime), false);
  });

});