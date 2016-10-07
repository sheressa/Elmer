'use strict';
const api = CONFIG.WhenIWork;
const express = require('express');
const router = express.Router();
const mandrill = require('mandrill-api/mandrill');
const mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);
const message = {
    subject: 'Churned CC Job Completed',
    from_email: 'support@crisistextline.org',
    from_name: 'Crisis Text Line',
    to: [{
        email: 'mariya@crisistextline.org',
        type: 'to'
    }]
};
router.post('/', function(req, res){
  var emails = req.body.split(' ').filter((item, index)=>{if (index%2!==0) return item});
  message.content = emails;
  getUsersToClean(emails)
  .then(()=>{
    mandrill_client.messages.send({message: message, key: 'Churned CC Job Completed'}, function (response) {
      CONSOLE_WITH_TIME(response);
    res.status(200).end(); 
    });
  })
  .catch(function(error){
    CONSOLE_WITH_TIME('Churned user deletion failed', error);
  })

});

function getUsersToClean(churnedUserEmailList) {
  return new Promise(function (resolve, reject) {
    var email;
    var uidsToClean = [];
    // look for churned users matches in WiW users list
    global.USERS_CACHE.forEach(function (each) {
      try {
          email = JSON.parse(each.notes).canonicalEmail;
      } catch (error) {
        email = each.email;
      }

      if (churnedUserEmailList.indexOf(email) >= 0) {
        uidsToClean.push(each.id);
      }
    });
    // delete the user and all user's shifts 
    uidsToClean.forEach(function(id, index){
      CONSOLE_WITH_TIME(`Deleting user ${id}`);
      api.delete(`users/${id}?delete_shifts=true`, function(res){
        if(res.error) CONSOLE_WITH_TIME(`CHURNED DELETION OF USER ${id} FAILED:`, res.error)
        else CONSOLE_WITH_TIME('Deleted user', id)
      });
      if(index===uidsToClean.length-1) resolve();
    });
  });
}
module.exports = router;