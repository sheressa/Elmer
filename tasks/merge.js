'use strict';

const merge = require('../jobs/scheduling/MergeOpenShifts').mergeOpenShifts;

module.exports.merge = function() {
  merge();
};