var WhenIWork = require.main.require('wheniwork-unofficial')
  , api
  ;

function initAPI() {
  if (!api) {
    return api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password)
  }
  else {
    return api;
  }
}

module.exports = initAPI;
