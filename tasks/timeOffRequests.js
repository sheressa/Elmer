'use strict';

const moment = require('moment');
const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const fs = require('fs');
const getReqForTimeoff = require(CONFIG.root_dir + '/api_wiw/WiWRequests').getTimeoff;

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

  getReqForTimeoff(reqParams)
  .then(reformatForCSV)
  .then(callback)
  .catch(function(err){
    CONSOLE_WITH_TIME(err);
  });
};

function createDateParams(endTimeDate, daysBack) {
  const end = endTimeDate.format(dateFormat);
  const start = moment(end, dateFormat).subtract(daysBack, 'days').format(dateFormat);
  return {start, end};
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

