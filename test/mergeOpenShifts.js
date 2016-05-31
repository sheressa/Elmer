var nock = require('nock')
  , WhenIWork = require('wheniwork-unofficial')
  ;

var assert = require('assert')
  , sampleData = require('./sampleData');
var mergeOpenShiftsObject = require(global.config.root_dir + '/jobs/scheduling/controllers/mergeOpenShifts.js');
var mergeOpenShifts = mergeOpenShiftsObject.mergeOpenShifts;

describe('merge open shifts', function() {

  beforeEach(function() {

    // var apiMocker = nock('https://api.wheniwork.com/2')
    //       .get('/shifts')
    //       .query(true)
    //       .reply(200, {shifts: [sampleData.shifts]});

    // var apiMocker2 = nock('https://api.wheniwork.com/2')
    //       .post('/batch', {})
    //       .query(true)
    //       .reply(203, {});

  });

  var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

  describe('batch payload creation', function() {

    it('adds open regular shifts to batch', function (done) {

      var result = mergeOpenShifts('regShifts');
      assert.equal(result.length, 2);
      done();

    });

    it('adds open makeup shifts to batch', function (done) {

      var result = mergeOpenShifts('makShifts');
      assert.equal(result.length, 2);
      done();

    });

  });

});

