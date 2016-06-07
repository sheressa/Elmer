var colorize = require('../lib/ColorizeShift').go
  , dateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ'
  , moment = require('moment')
  , assert = require('assert')
  ;
var red = require('../lib/ColorizeShift').red
  , darkGray = require('../lib/ColorizeShift').darkGray
  , lightGray = require('../lib/ColorizeShift').lightGray
  ;

var unixTimeForThursday4am = 1456995600000
  , unixTimeForThursday10am = 1457017200000
  , unixTimeForThursday12pm = 1463054400000
  ;

describe('ColorizeShift.go', function () {
  describe('colorize(obj, timestamp, isMakeupBoolean)', function() {
    it('should make a one-time Thursday 12pm shift light gray', function() {
      var time = moment(unixTimeForThursday12pm).format(dateFormat);
      var isOneTime = true;
      var shift = {};
      shift = colorize(shift, time, isOneTime);
      assert.equal(shift.color, lightGray);
    });

    it('should not make a weekly 10am shift light gray', function() {
      var time = moment(unixTimeForThursday10am).format(dateFormat);
      var isOneTime = false;
      var shift = {};
      shift = colorize(shift, time, isOneTime);
      assert.notEqual(shift.color, lightGray);

    });
  });

  describe('colorize(obj, timestamp)', function () {
    it('should make a weekly 4am shift red', function() {
      var time = moment(unixTimeForThursday4am).format(dateFormat);
      var isOneTime = false;
      var shift = {};
      shift = colorize(shift, time, isOneTime);
      assert.equal(shift.color, red);
    });

    it('should make a weekly 10am shift dark gray', function() {
      var time = moment(unixTimeForThursday10am).format(dateFormat);
      var isOneTime = false;
      var shift = {};
      shift = colorize(shift, time, isOneTime);
      assert.equal(shift.color, darkGray);
    });

    it('doesn\'t require a third isMakeup param to run', function() {
      var time = moment(unixTimeForThursday10am).format(dateFormat);
      var shift = {};
      shift = colorize(shift, time);
      assert.equal(shift.color, darkGray);
    });
  });

  describe('colorize(obj)', function () {
    it('should make a weekly 4am shift red', function() {
      var shift = {};
      shift.start_time = moment(unixTimeForThursday4am).format(dateFormat);
      shift = colorize(shift);
      assert.equal(shift.color, red);
    });

    it('should make a weekly 10am shift dark gray', function() {
      var shift = {};
      shift.start_time = moment(unixTimeForThursday10am).format(dateFormat);
      shift = colorize(shift);
      assert.equal(shift.color, darkGray);
    });
  });
});

