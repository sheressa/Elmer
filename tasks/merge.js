var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(keys.wheniwork.api_key, keys.wheniwork.username, keys.wheniwork.password);

var merge = require('../jobs/scheduling/MergeOpenShifts');

module.exports.merge = function() {
  merge();
}
