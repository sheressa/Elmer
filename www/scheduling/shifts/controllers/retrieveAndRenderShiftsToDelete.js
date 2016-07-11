var helpers = require(CONFIG.root_dir + '/www/scheduling/helpers')
  , moment = require('moment')
  ;

var wiwDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ'
  , chooseRegShiftToCancelPageStartDateFormat = 'dddd h:mm a' // Wednesday 4:00 p
  , chooseRegShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , chooseMakeupShiftToCancelPageStartDateFormat = 'dddd, MMM Do YYYY - h:mm a' // Wednesday, Mar 30th 2016 - 4:00 p
  , chooseMakeupShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , scheduleShiftsURL = '/scheduling/login?'
  ;

function retrieveAndRenderShiftsToDelete(req, res, whenIWorkAPI) {
  var email = req.query.email;
  if (!helpers.validate(req.query.email, req.query.token)) {
    res.status(403).send('Access denied.');
  }

  var altEmail = helpers.generateAltEmail(email);

  whenIWorkAPI.get('users?include_objects=false', function (dataResponse) {
    var users = dataResponse.users
      , user
      , templateData
      ;

    for (var i = 0; i < users.length; i++) {
      user = users[i];
      if (user.email == email || user.email == altEmail) {
        var userName = user.first_name + ' ' + user.last_name;
        var userID = user.id;
        var fn = user.first_name;
        var ln = user.last_name;
        var query = {
          user_id: userID,
          start: '-1 day',
          end: '+180 days',
          location_id: [CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts]
        };

        // Need to not add `include_objects=false`, otherwise query returns all shifts. No idea why.
        whenIWorkAPI.get('shifts', query, function(response) {
          var url = scheduleShiftsURL + 'email=' + encodeURIComponent(email) + '&token=' + req.query.token;
          if (!response.shifts || !response.shifts.length) {
            var error = "You don't seem to have booked any shifts to delete! If this message is sent in error, contact support@crisistextline.org";
            templateData = {
                regularShifts: [],
                makeupShifts: [],
                userID: userID,
                email: email,
                token: req.query.token,
                userName: userName,
                error: error,
                url: url
            };
            res.render('scheduling/chooseShiftToCancel', templateData);
            return;
          }
          var shifts = response.shifts
            , makeupShifts = []
            , regularShifts = []
            , targetShift
            ;

          // Filter makeup shifts from regular shifts
          for (var i = 0 ; i < shifts.length; i++) {
            targetShift = shifts[i];
            if (targetShift.location_id === CONFIG.locationID.regular_shifts) {
                regularShifts.push(targetShift);
            }
            else if (targetShift.location_id === CONFIG.locationID.makeup_and_extra_shifts) {
                makeupShifts.push(targetShift);
            }
          }

          /**
            If the user creates a regular shift and it hasn't been recurred, we're going to direct the user
            to refresh. (The rest of deleting recurring shifts relies on using the parent_shift property
            stored in the shift.notes param.)
          **/
          regularShifts.forEach(function(shift) {
            if (!shift.notes) {
              var error = "Sorry! The page is loading slowly. Please wait 30 seconds, and then refresh and try again. \n" +
                          "If this problem persists please let us know via email to support@crisistextline.org";
              res.render('scheduling/chooseShiftToCancel', { error: error , url: url});
              return;
            }
          });
          // Removes duplicate reg shifts--those that are in the same recurrence chain.
          var i = regularShifts.length;
          while (i--) {
            if (!regularShifts[i]) {
              continue;
            }
            regularShifts = regularShifts.filter(
              function(shift, index) {
                if (i === index) {
                  return true;
                }
                return !helpers.areShiftsDuplicate(regularShifts[i], shift);
              }
            );
          }
          // Sorting regularShifts by when they occur on the weekly calendar
          regularShifts.sort(function(shiftA, shiftB) {
            return helpers.sortByDayAscAndTimeAsc(moment(shiftA.start_time, wiwDateFormat), moment(shiftB.start_time, wiwDateFormat));
          });

          // Formatting regularShift shift.notes and time display to be more user-readable
          regularShifts.forEach(function(shift) {
            try {
            shift.parentShiftID = JSON.parse(shift.notes).parent_shift;
            }
            catch (e) {
              CONSOLE_WITH_TIME('Error parsing JSON for shift: ', shift.id, ' error: ', e);
            }
            shift.start_time = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseRegShiftToCancelPageStartDateFormat);
            shift.end_time = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseRegShiftToCancelPageEndDateFormat);
          });

          // Sorting makeupShifts in order of when they occur
          makeupShifts.sort(function(shiftA, shiftB) {
            return helpers.dateSort(moment(shiftA.start_time, wiwDateFormat), moment(shiftB.start_time, wiwDateFormat));
          });

          makeupShifts.forEach(function(shift) {
            shift.start_time = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseMakeupShiftToCancelPageStartDateFormat);
            shift.end_time = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseMakeupShiftToCancelPageEndDateFormat);
          });

          templateData = {
            regularShifts: regularShifts,
            makeupShifts: makeupShifts,
            userID: userID,
            email: email,
            token: req.query.token,
            userName: userName
          };
          // emitter.emit('chooseShiftsToDeleteJadeTemplateData', templateData);
          // Then, display them in the jade template.
          res.render('scheduling/chooseShiftToCancel', templateData);
          return;
        })
        break;
      }
    }
  })
}

module.exports = retrieveAndRenderShiftsToDelete;
