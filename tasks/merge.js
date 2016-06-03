var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(global.KEYS.wheniwork.api_key, global.KEYS.wheniwork.username, global.KEYS.wheniwork.password);

var merge = require('../jobs/scheduling/MergeOpenShifts');

module.exports.merge = function() {
  merge();
};