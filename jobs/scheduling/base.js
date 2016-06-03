var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(global.KEYS.wheniwork.api_key, global.KEYS.wheniwork.username, global.KEYS.wheniwork.password);

module.exports = api;
