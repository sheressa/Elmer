var assert = require('assert');
var notifyMoreShifts = require('../jobs/scheduling/NotifyMoreShifts.js');
var sampleData = require(CONFIG.root_dir + '/sample_data/sampleData');

describe('notifyMoreShifts', function() {

    it('notifies people once a day', function (done) {

      var result = notifyMoreShifts.go(sampleData);
      assert.equal(result.one_shift_post.ids[0], 5674794);
      done();

    });

    it('sends two shift notifications', function (done) {
    
      var result = notifyMoreShifts.go(sampleData);
      assert.equal(result.two_shift_post.ids[0], 5674724);
      done();

    });

});