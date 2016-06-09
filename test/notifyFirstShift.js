var assert = require('assert');
var notifyMoreShifts = require('../jobs/scheduling/NotifyFirstShift.js');
var sampleData = require(CONFIG.root_dir + '/test/sampleData');

describe('notifyFirstShift', function() {

    it('notifies people once a day', function (done) {

      var result = notifyFirstShift(sampleData);
      assert.equal(result, 5674794);
      done();

    });

    xit('sends two shift notifications', function (done) {
    
      var result = notifyMoreShifts.go(sampleData);
      assert.equal(result.two_shift_post.ids[0], 5674724);
      done();

    });

});

