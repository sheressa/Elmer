'use strict';

const api = CONFIG.WhenIWork;
const churnedUserEmailList = require('../churnedUserEmailList');

/**
  To run this task, add a "churnedUserList.js" file to the root directory exporting
  an array of email strings that need to be deleted. (Formatted like emails.example.js)

  Then run: node console removeChurned go.
**/

module.exports.go = function () {
  getUsersToClean()
  .catch(function(error){
    CONSOLE_WITH_TIME('Churned user deletion failed', error);
  })
};

function getUsersToClean() {
  return new Promise(function (resolve, reject) {
    var users, email;
    var uidsToClean = [];
    api.get('users?include_objects=false', function (res) {
      if (!res) reject('Call to get WiW users failed');
      users = res.users;

      users.forEach(function (each, item, arr) {
        try {
          email = JSON.parse(each.notes).canonicalEmail;
        } catch (error) {
          email = each.email;
        }

        if (churnedUserEmailList.indexOf(email) >= 0) {
          uidsToClean.push(each.id);
        }
      });
      // deletes all users and their shifts
      uidsToClean.forEach(function(id){
        api.delete('users/'+id+'?delete_shifts=true');
      });
    });
  });
}