const WhenIWork = require('wheniwork-unofficial');
const api = new WhenIWork(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password, "Crisis Text Line Supervisors");

module.exports = api;
