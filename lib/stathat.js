var stathat = require('stathat');

module.exports.increment = function (stat, value) {
  if (!shouldLog()) return;

  stathat.trackEZCount(KEYS.stathat.email, stat, value, function () {});
};

module.exports.log = function (stat, value) {
  if (!shouldLog()) return;

  stathat.trackEZValue(KEYS.stathat.email, stat, value, function () {});
};

function shouldLog() {
  return KEYS.stathat.enabled;
}
