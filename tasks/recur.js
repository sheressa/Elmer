'use strict';

const recurrer = require('../jobs/scheduling/RecurOpenShifts');
const moment = require('moment');

module.exports.recurFromUnixTimestamp = function (from) {
  from = parseInt(from);

  var t = moment(from);
  recurrer.recurOpenShifts(t);
  recurrer.cronJob.stop();
};
