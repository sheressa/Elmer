global.CONFIG = require('./config.js');
const api = CONFIG.WhenIWork;
var users = {};
var cache;

//cache for all WhenIWork users, active and deleted
(function WiWUsersCache(){


    function singleton(){  
      console.log('in singleton')
      return new Promise (function(resolve, reject){
        api.get('users', {show_deleted: true}, function(response){
          console.log('got some back')
          if(response.message) reject('Call to get all WiW users failed');
          resolve(response.users);
        });
      });
    }

    if(!cache) {
      singleton()
      .then(function(response){
        console.log('response in config', response[0])
        cache = response;
        module.exports = cache;
        // return cache;
        // resolve(cache);
      });
    } else {
      console.log('IN ELSE')
      module.exports = cache;

    }

})();

