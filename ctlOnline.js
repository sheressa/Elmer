'use strict';
const request = require('request-promise');
const ctlOnline = {};

// Consolidates creation of default options for request-promise to CTL online
function buildOptions (reqOptions) {
  reqOptions.url = `https://online.crisistextline.org/api/v1/${reqOptions.urlExtension}`;
  delete reqOptions.urlExtension;
  reqOptions.qs = reqOptions.qs || {};
  reqOptions.qs['api-key'] = KEYS.CTLOnline.api_key;
  reqOptions.headers = reqOptions.headers || {};
  reqOptions.headers['User-Agent'] = 'Request-Promise';
  reqOptions.json = true;

  return reqOptions;
}

// Get UserId from an Email address
ctlOnline.uidFromEmail = function(email) {
  const options = buildOptions({
    urlExtension: `user`,
    qs: {
      'parameters[mail]': email,
    }
  });

  return request(options).then(function(response) {
    return response[0].uid;
  }).catch(err => {
    CONSOLE_WITH_TIME(`[Error] finding CTL online uid for ${email}: ${err}`);
  });
};

// Adds the Role "Crisis Counselor 1" for user with specified User Id
ctlOnline.addCC1Role = function(uid) {
  const options = buildOptions({
    urlExtension: `rules/rules_add_cc1_role`,
    method: 'POST',
    body: {
      uid
    }
  });

  return request(options).catch(err => {
    CONSOLE_WITH_TIME(`[Error] adding 'Crisis Counselor 1 role for UID ${uid}: ${err}`);
  });
};

module.exports = ctlOnline;