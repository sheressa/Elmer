global.CONFIG = require('./config.js');
const api = CONFIG.WhenIWork;

//cache for all WhenIWork users, active and deleted
function WiWUsersCache(){
  return new Promise (function(resolve, reject){
    api.get('users', {show_deleted: true}, function(response){
      if(response.message) reject('Call to get all WiW users failed');
      resolve(response.users);
    });
  });
};

module.exports = WiWUsersCache;
