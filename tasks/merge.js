var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password);

var merge = require('../jobs/scheduling/MergeOpenShifts').mergeOpenShifts;

module.exports.merge = function() {
  merge();
};