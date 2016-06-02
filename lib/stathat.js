var stathat = require('stathat');

module.exports.increment = function (stat, value) {
  if (!shouldLog()) return;

  stathat.trackEZCount(keys.stathat.email, stat, value, function () {});
};

module.exports.log = function (stat, value) {
  if (!shouldLog()) return;

  stathat.trackEZValue(keys.stathat.email, stat, value, function () {});
};

function shouldLog() {
  return keys.stathat.enabled;
}
