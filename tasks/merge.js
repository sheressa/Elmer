var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

var merge = require('../jobs/scheduling/MergeOpenShifts').mergeOpenShifts;

module.exports.merge = function() {
  merge();
}
