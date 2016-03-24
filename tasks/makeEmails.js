var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);
var emails = require('./emails');

// Create an array indexed by the admin+ email address, ex:
// { 'admin+banana@crisistextline.org': 'banana' }
var adminEmails = {};
for (var i in emails) {
  adminEmails[getAdmin(emails[i])] = emails[i];
}

// node console makeEmails go
module.exports.go = function () {
  api.get('users', function (data) {
    data.users.forEach(function (obj, i, arr) {
      updateNotes(obj);
    });
  });
};


function updateNotes(user) {
  var note = {};
  var email = user.email;

  if (user.notes.length > 0) {
    note[user.notes.trim()] = true;
  }

  if (isAdmin(user.email)) {
    email = adminEmails[user.email.toLowerCase()];
  }

  note.canonicalEmail = email;

  if (note.canonicalEmail == undefined) {
    console.log(user);
  } else {
    api.update('user/' + user.id, { notes: JSON.stringify(note) });
  }
}

function isAdmin(email) {
  return email.indexOf('admin+') === 0;
}

function getAdmin(email) {
  email = email.replace(/\W+/g, '');
  return 'admin+' + email + '@crisistextline.org';
}
