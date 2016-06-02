var nock = require('nock')
  , WhenIWork = require('wheniwork-unofficial')
  ;

var assert = require('assert')
  , sampleData = require('./sampleData');
var mergeOpenShiftsObject = require(global.config.root_dir + '/jobs/scheduling/controllers/mergeOpenShifts.js');
var mergeOpenShifts = mergeOpenShiftsObject.mergeOpenShifts;

describe('merge open shifts', function() {

  var api = new WhenIWork(keys_test.wheniwork.api_key, keys_test.wheniwork.username, keys_test.wheniwork.password);

  describe('batch payload creation', function() {

    it('adds open regular shifts to batch', function (done) {
          var apiMocker = nock('https://api.wheniwork.com/2')
          .post('/batch')
          .query(true)
          .reply(203, {});
      var result = mergeOpenShifts('regShifts');
      assert.equal(result.length, 2);
      done();

    });

    it('adds open makeup shifts to batch', function (done) {
          var apiMocker2 = nock('https://api.wheniwork.com/2')
          .post('/batch')
          .query(true)
          .reply(203, {});
      var result = mergeOpenShifts('makShifts');
      assert.equal(result.length, 2);
      done();

    });

  });

});

