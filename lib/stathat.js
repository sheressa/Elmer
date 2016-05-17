var stathat = require('stathat');

module.exports.increment = function (stat, value) {
  if (!shouldLog()) return;

  stathat.trackEZCount(global.config.stathat.email, stat, value, function () {});
};

module.exports.log = function (stat, value) {
  if (!shouldLog()) return;

  stathat.trackEZValue(global.config.stathat.email, stat, value, function () {});
};

function shouldLog() {
  return global.config.stathat.enabled;
}
