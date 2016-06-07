var WhenIWork = require.main.require('wheniwork-unofficial');

// Node will re-use a module once you import it once, so this API will not initialized twice.
var api = new WhenIWork(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password);

module.exports = api;
