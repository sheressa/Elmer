var WhenIWork = require.main.require('wheniwork-unofficial');

// Node will re-use a module once you import it once, so this API will not initialized twice.
var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

module.exports = api;
