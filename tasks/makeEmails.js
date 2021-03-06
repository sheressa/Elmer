/**
  Using an array of user emails imported from the platform, we identify the WhenIWork user which corresponds to each user data
  object and update that WiW profile's notes param with the canonical email.

  We do this in service of the missed shift notifications feature on the
  platform, which requires the `/shifts/time-interval` endpoint on Elmer.
  We want to return the proper (un-transformed) email address, so we use this
  task to store it in WiW.
**/
'use strict';

const api = CONFIG.WhenIWork;
const emails = require('./canonicalEmails');

// Create an array indexed by the admin+ email address, ex:
// { 'admin+banana@crisistextline.org': 'banana' }
var adminEmails = {};
for (var i in emails) {
  adminEmails[getAdmin(emails[i])] = emails[i];
}

// node console makeEmails go
module.exports.go = function () {
  var batchRequestArray = [];
  var params = {
    include_objects: false
  };
  api.get('users', params, function (data) {
    data.users.forEach(function (obj, i, arr) {
      updateNotes(obj, batchRequestArray);
    });
    api.post('batch', batchRequestArray, function(response) {
      //The response at this point doesn't include error status codes so we're looking for a message that indicates an error
      if (response && response.message && /error/.test(response.message)) CONSOLE_WITH_TIME("Error in Task Make Emails Batch Response: ", response);
      else (CONSOLE_WITH_TIME("Task Make Emails Batch Post Success"));
    });
  });
};

function updateNotes(user, batchRequestArray) {
  var note = {}
    , email = user.email
    , updateRequest
    ;

  try {
    user.notes = JSON.parse(user.notes);
  }
  catch(e){
    CONSOLE_WITH_TIME('User notes field is not a parseable JSON object, user: ', user, ' error: ', e);
  }

  // If the user's notes property is populated, but it's not a JSON string,
  // add it to the JSON object we're creating and will update it with.
  if (user.notes.length > 0 && !isThisStringJSON(user.notes)) {
    note[user.notes.trim()] = true;
  }

  // If the WiW notes-stored email of the user is equal to the email we have on
  // the platform, we don't need to update anything.
  if (user.notes && user.notes.canonicalEmail === adminEmails[getAdmin(email.toLowerCase())]) {
    CONSOLE_WITH_TIME('dont need to update', adminEmails[getAdmin(email.toLowerCase())], ' ', email, user.notes.canonicalEmail)
    return;
  }

  // If the WiW email address is an admin+ email address, we find the equivalent
  // un-transformed email address.
  if (isAdmin(user.email)) {
    email = adminEmails[user.email.toLowerCase()];
  }

  // Then, we reassign the canonicalEmail email in the note section.
  if (email == undefined) {
    CONSOLE_WITH_TIME
    ('User with undefined email: ', user);
  }
  else {
    note.canonicalEmail = email.toLowerCase();
    CONSOLE_WITH_TIME('updating user with: ', note);
    updateRequest = {
      method: 'PUT',
      url: '/users/' + user.id,
      params: {
        notes: JSON.stringify(note)
      }
    }
    batchRequestArray.push(updateRequest);
  }
  return;
}

function isThisStringJSON(str) {
  try {
    JSON.parse(str);
  }
  catch (e) {
    return false;
  }
  return true;
}

function isAdmin(email) {
  return email.indexOf('admin+') === 0;
}

function getAdmin(email) {
  email = email.replace(/\W+/g, '');
  return 'admin+' + email + '@crisistextline.org';
}
