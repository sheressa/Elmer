'use strict';
const api = CONFIG.WhenIWork;

//cache for all WhenIWork users, active and deleted
function WiWUsersCache(){
  return new Promise (function(resolve, reject){
    api.get('users', {show_deleted: true}, function(response){
      CONSOLE_WITH_TIME('users call within cache made, number of users returned: ', response.users.length);
      if(response.message) reject('Call to get all WiW users failed');
      try {
        if(typeof response !=='object') throw('WiW all users response is not in the proper JSON format');
        resolve(response.users);
      } catch (error) {
        reject(error);
      }
    });
  });
};


module.exports = WiWUsersCache;
