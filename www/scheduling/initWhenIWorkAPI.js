var WhenIWork = require.main.require('wheniwork-unofficial');
global.KEYS = require('../../keys.js');

// Node will re-use a module once you import it once, so this API will not initialized twice.
var api = new WhenIWork(global.KEYS.wheniwork.api_key, global.KEYS.wheniwork.username, global.KEYS.wheniwork.password);

module.exports = api;
