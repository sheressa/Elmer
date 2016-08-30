/**
    Retrieves the shifts and owners' email addresses which fall within a requested
    time interval.

    @request params
        - start {string} the start time to retrieve shifts, in UNIX epoch secs (not millisecs)
        - end {string} the end time to retrieve shifts
    @response
        Returns array of user email (key) user's shift array (value) objects.
    @notes
        WhenIWork API retrieves shifts that START between the start and end times. Note that the end time is not inclusive of itself--i.e., querying for shift times
        with epoch stamps corresponding to start=2pm and end=4pm will only retrieve shifts
        which begin at a time between 2pm and 3:59pm. It will not retrieve shifts which begin at 4pm.
**/

var moment = require('moment')
  , sha1 = require('sha1')
  ;

var wiwDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ'
  ;

function retrieveShiftsAndOwnersWithinTimeInterval(req, res, whenIWorkAPI) {
  var startTime = req.query.start
    , endTime = req.query.end
    , token = req.query.token
    ;

  if (req.query.token !== sha1(KEYS.platform_secret_key)) {
    res.status(403).send('Access denied.');
    return;
  }

  var query = {
    start: moment.unix(startTime).format(wiwDateFormat),
    end: moment.unix(endTime).format(wiwDateFormat),
    location_id: [ CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts ],
    include_objects: false
  };

  whenIWorkAPI.get('shifts', query, function(response) {
    var shifts = response.shifts
      , shift
      , userShiftData = {}
      , getUserEmailRequest
      , batchPayload = []
      ;
    if (!shifts || shifts.length === 0) {
      res.status(204).send('No shifts found.');
      return;
    }
    // We've found shifts. Now let's find the emails of their owners via batch req.
    for (var i = 0; i < shifts.length; i++) {
      shift = shifts[i];
      if (!shift.is_open) {
        if (!userShiftData[shift.user_id]) {
          userShiftData[shift.user_id] = [shift];
          getUserEmailRequest = {
            "method": "GET",
            "url": "/users/" + shift.user_id
          };
          batchPayload.push(getUserEmailRequest);
        }
        else {
          userShiftData[shift.user_id].push(shift);
        }
      }
    }

    whenIWorkAPI.post('batch', batchPayload, function(response) {
      var user
        , email
        , returnArray = []
        , placeholder
        ;
      for (var i = 0; i < response.length; i ++) {
        user = response[i].user;
        if (userShiftData[user.id]) {
          email = user.email;
          if (user.notes) {
            /**
              Retrieving email from user notes, where we've stored
              the non-transformed email (i.e., txiang@ctl.org, not
              admin+txiangctlorg@crisistextline.org)
            **/
            try {
              email = JSON.parse(user.notes).canonicalEmail;
            }
            catch(e) {
              CONSOLE_WITH_TIME('JSON.parse failed for examining user notes for user: ' + user.id + ', error: ', e);
            }
          }
          userShiftData[email] = { 'shiftData' : userShiftData[user.id], 'userData': user };
          delete userShiftData[user.id];
        }
      }
      // Transforming object of keys and values into array.
      for (key in userShiftData) {
        var key = key;
        placeholder = {};
        placeholder[key] = userShiftData[key];
        returnArray.push(placeholder);
      }
      res.json(returnArray);
    })
  })
}

module.exports = retrieveShiftsAndOwnersWithinTimeInterval;
