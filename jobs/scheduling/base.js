var CONFIG = require('../../config.js');
var KEYS = require('../../keys.js');

var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password);

module.exports = api;
