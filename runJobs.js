global.KEYS = require('./keys.js');
global.CONFIG = require('./config');
const cache = require('./cache.js');
require('newrelic');

if (process.env.NODE_ENV !== 'production') {
	CONFIG.locationID.regular_shifts = CONFIG.locationID.test;
  CONFIG.locationID.new_graduate = CONFIG.locationID.test;
  CONFIG.locationID.makeup_and_extra_shifts = CONFIG.locationID.test2;
}

(function CacheInit(){
	if (global.USERS_CACHE) return;
	cache()
	.then(function(users){
		global.USERS_CACHE = users;
		const jobs = require('require-all')(__dirname + '/jobs');
	})
	.catch(function(error){
		console.error(error);
		CacheInit();
	})
})();