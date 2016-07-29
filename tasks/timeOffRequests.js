'use strict';

const api = CONFIG.WhenIWork;
const moment = require('moment');
const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const fs = require('fs');

/* 
  To run this task: node console timeOffRequests timeOffRequests
  timeOffRequests: Returns a csv (written to file) of timeOffRequests for designated timeframe. 

  Parameters
  ----------
  endTimeDate : String
    Designates the latest date of the request
    Defaults to todays date and time
  daysBack : Number
    How many days before the endTimeDate to request
*/

module.exports.timeOffRequests = function (options = {}, callback = exportCSV) {
  const endTimeDate = options.endTimeDate ? moment(options.endTimeDate, dateFormat) : moment();
  const daysBack = options.daysBack || 14;
  const reqParams = createDateParams(endTimeDate, daysBack);

  getRequestsPromise(reqParams)
  .then(mergeResponses)
  .then(reformatForCSV)
  .then(callback)
  .catch(function(err){
    CONSOLE_WITH_TIME(err);
  });
};

function createDateParams(endTimeDate, daysBack) {
  const end = endTimeDate.format(dateFormat);
  const start = moment(end, dateFormat).subtract(daysBack, 'days').format(dateFormat);
  return {start: start, end: end};
}

function getRequestsPromise (params) {
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

  return ({allUsers:allUsers, allRequests:allRequests});
}

function reformatForCSV (mergedResponse) {
  // accepts {allUsers:allUsers, allRequests:allRequests}
  // indicate ids are WiW and add user email to keys
  const keys = 'email,first,last,wiwReqId,wiwAccountId,wiwUserId,wiwCreatorId,wiwUpdaterId' + 
    ',status,type,hours,start_time,end_time,created_at,updated_at,canceled_by';

  let CSVFormatedString = keys + '\n';

  let req;
  let user;
  let reqString;

  for (let key in mergedResponse.allRequests) {
    req = mergedResponse.allRequests[key];
    user = mergedResponse.allUsers[req.user_id];
    // this order must match the keys described above.
    reqString = user.email + ',' + user.firstName.replace(/,/g, '') + ',' + user.lastName.replace(/,/g, '') + ',' + 
      req.id + ',' + req.account_id + ',' + req.user_id + ',' + req.creator_id + ',' + 
      req.updater_id + ',' + req.status + ',' + req.type + ',' + req.hours + ',' + 
      req.start_time.replace(/,/g, '') + ',' + req.end_time.replace(/,/g, '') + ',' + 
      req.created_at.replace(/,/g, '') + ',' + req.updated_at.replace(/,/g, '') + 
      ',' + req.canceled_by + '\n';

    CSVFormatedString += reqString;
  }

  return CSVFormatedString;
}

function exportCSV (CSVString) {
  fs.writeFile('./timeOffRequests.csv', CSVString, 'utf8', function (err) {
    if (err) CONSOLE_WITH_TIME('FS err:', err);
    else {
      CONSOLE_WITH_TIME('It\'s saved!');
    }
  });
}

