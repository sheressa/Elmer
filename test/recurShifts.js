var assert = require('assert');
var recurNewlyCreatedShifts = require('../jobs/scheduling/RecurShifts.js');
var result = recurNewlyCreatedShifts.recurNewlyCreatedShifts();
var testShift = { id: 284948029,
       account_id: 549781,
       user_id: 5674724,
       location_id: 1003765,
       position_id: 0,
       site_id: 0,
       start_time: 'Mon, 01 Feb 2016 16:00:00 -0500',
       end_time: 'Mon, 01 Feb 2016 18:00:00 -0500',
       break_time: 0,
       color: 'cccccc',
       notes: '{"original_owner":5674723, "parent_shift":277119256}',
       alerted: false,
       linked_users: null,
       shiftchain_key: '4kzml4',
       published: true,
       published_date: 'Mon, 25 Jan 2016 09:43:28 -0500',
       notified_at: 'Tue, 29 Nov -001 19:00:00 -0500',
       instances: 1,
       created_at: 'Mon, 18 Jan 2016 08:52:20 -0500',
       updated_at: 'Mon, 25 Jan 2016 09:43:28 -0500',
       acknowledged: 1,
       acknowledged_at: '',
       creator_id: 5005069,
       is_open: true,
       actionable: false,
       block_id: 0 };


describe('recurShifts', function() {

    it('should create a request task array', function (done) {
      assert.equal(result.requestTaskArray.length, 28);
      done();
    });

    it('should create a batch post request body', function (done) {
      assert.equal(result.batchPostRequestBody[0].params.id, 284948099);
      done();
    });

    it('should create a publish payload', function (done) {
      assert.equal(result.publishPayload.ids[0], 284948099);
      done();
    });

    it('recognizes when no shifts are returned from WiW', function (done) {
      var noShiftResult = recurNewlyCreatedShifts.recurNewlyCreatedShifts({shifts: {shifts: ''}});
      assert.equal(noShiftResult, 'NO SHIFTS RETURNED.');
      done();
    });

    it('decrements previous and next week\'s open shifts by one', function (done) {
      var decrementResult = recurNewlyCreatedShifts.decrementPrevWeeksAndNextWeeksOpenShiftsByOne(testShift);
      assert.equal(decrementResult[0].url, '/2/shifts/284948199');
      done();
    });

});

