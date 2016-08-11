'use strict';

const api = CONFIG.WhenIWork;

function getTimeoff (params) {
  return getTimeoffRequests(params)
  .then(mergeResponses)
  .catch(function(err){
    CONSOLE_WITH_TIME(err);
  });
}

function getTimeoffRequests (params) {
  const allResponses = [];
  let lastReqId;
  return new Promise(function(resolve, reject){
    // Scoped a recursive IIFE into the promise so that I can resolve out.
    (function makeGetRequest () {
      api.get('requests', params, function(response) {
        if (!response.requests) reject(response);
        allResponses.push(response);
        // The WiW API responds with a maximum of 200 requests, so if we received fewer (conservatively 100) we can resolve.
        if (response.requests.length < 100) resolve(allResponses);
        // If we received over 100 requests make a new request starting from the last object Id we received. 
        else {
          lastReqId = response.requests[response.requests.length-10].id;
          params.max_id = lastReqId;
          makeGetRequest ();
        }
      });
    })();
  });
}


function mergeResponses (responses){
  const allUsers = {};
  const allRequests = {};
  // merge the users and time off requests from all responses
  responses.forEach(function(response){
    response.requests.forEach(function(req){
      if (!allRequests[req.id]) {
        allRequests[req.id] = req;
      }
    });
    response.users.forEach(function(user){
      if (!allUsers[user.id]) {
        allUsers[user.id] = {};
        allUsers[user.id].email = /canonicalEmail/.test(user.notes) ? 
        JSON.parse(user.notes).canonicalEmail : 
        user.email;
        allUsers[user.id].firstName = user.first_name;
        allUsers[user.id].lastName = user.last_name;
      }
    });
  });

  return ({allUsers, allRequests});
}


module.exports = {getTimeoff};