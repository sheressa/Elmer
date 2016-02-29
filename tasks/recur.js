var recurrer = require('../jobs/scheduling/RecurOpenShifts');
var moment = require('moment');

console.log(global.config.crisisCounselorsPerSupervisor);

module.exports.recurFromUnixTimestamp = function (from, to) {
  from = parseInt(from);
  to = parseInt(to);

  for (var i = from; i <= to; i += 1000*60*60*2) {
    var t = moment(i);
    recurrer.recurOpenShifts(t);
  }
};
