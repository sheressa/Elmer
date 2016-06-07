var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password);

var merge = require('../jobs/scheduling/MergeOpenShifts');

module.exports.merge = function() {
  merge();
};