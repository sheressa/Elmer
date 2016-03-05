var colorize = require('../lib/ColorizeShift');
var dateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var moment = require('moment');
var assert = require('assert');

var tests = [
  {
    time: moment(1456995600000).format(dateFormat),
    humanReadable: 'make 4am red',
    color: 'D61F27'
  }, {
    time: moment(1457017200000).format(dateFormat),
    humanReadable: 'make 10am gray',
    color: 'AAAAAA'
  }
];

describe('ColorizeShift', function () {
  describe('colorize(obj, timestamp)', function () {
    for (var i in tests) {
      it('should ' + tests[i].humanReadable, function () {
        var shift = {};
        shift = colorize(shift, tests[i].time);
        assert.equal(shift.color, tests[i].color);
      });
    }
  });

  describe('colorize(obj)', function () {
    for (var i in tests) {
      it('should ' + tests[i].humanReadable, function () {
        var shift = {start_time: tests[i].time};
        shift = colorize(shift);
        assert.equal(shift.color, tests[i].color);
      });
    }
  });
});

