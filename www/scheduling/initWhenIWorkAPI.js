var WhenIWork = require.main.require('wheniwork-unofficial');

// Node will re-use a module once you import it once, so this API will not initialized twice.
var api = new WhenIWork(keys.wheniwork.api_key, keys.wheniwork.username, keys.wheniwork.password);

module.exports = api;
