var recurrer = require('../jobs/scheduling/RecurOpenShifts');
var moment = require('moment');

module.exports.recurFromUnixTimestamp = function (from) {
  from = parseInt(from);

  var t = moment(from);
  recurrer.recurOpenShifts(t);
};
