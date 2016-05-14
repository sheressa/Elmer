var helpers = require(global.config.root_dir + '/www/scheduling/helpers')
  , moment = require('moment')
  , returnColorizedShift = require(global.config.root_dir + '/lib/ColorizeShift').go
  ;

var wiwDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ'
  , chooseRegShiftToCancelPageStartDateFormat = 'dddd h:mm a' // Wednesday 4:00 p
  , chooseRegShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , chooseMakeupShiftToCancelPageStartDateFormat = 'dddd, MMM Do YYYY - h:mm a' // Wednesday, Mar 30th 2016 - 4:00 p
  , chooseMakeupShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , scheduleShiftsURL = '/scheduling/login?'
  ;

function deleteShiftsAndRedirect(req, res, whenIWorkAPI) {
  if (!helpers.validate(req.query.email, req.query.token)) {
    res.status(403).send('Access denied.');
  }

  var parentShiftIDsOfRegularShiftsToBeDeleted = []
    , shiftIDsOfMakeupShiftsToBeDeleted = []
    , key
    ;

  for (key in req.query) {
    if (key.substr(0, 8) === 'regShift' && req.query[key] === 'on') {
      parentShiftIDsOfRegularShiftsToBeDeleted.push(parseInt(key.substr(8)));
    }
    else if (key.substr(0, 8) === 'makShift' && req.query[key] === 'on') {
      shiftIDsOfMakeupShiftsToBeDeleted.push(parseInt(key.substr(8)));
    }
  }

  var query = {
    user_id: req.query.userID,
    start: '-1 day',
    end: '+50 years',
    unpublished: true,
    location_id: [ global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts ]
  };

  whenIWorkAPI.get('shifts', query, function (data) {
    var parentShiftID
      , shift
      , batchPayload = []
      , deletedShiftInformation = {regShifts : {}, makShifts : {}}
      ;

    data.shifts.forEach(function(shift) {
        if (shift.location_id === global.config.locationID.regular_shifts) {
          try {
            parentShiftID = JSON.parse(shift.notes).parent_shift;
          }
          catch (e) {
            parentShiftID = null;
            console.log('Error parsing JSON for shift: ', shift.id, ' error: ', e);
          }

          if (parentShiftIDsOfRegularShiftsToBeDeleted.indexOf(parentShiftID) != -1) {
            // If the shift starts within a week, it's a shift that needs to be converted to an
            // open shift because the open shift job has already run and passed that day.
            if (Math.abs(moment().diff(moment(shift.start_time, wiwDateFormat), 'days')) < global.config.time_interval.days_in_interval_to_repeat_open_shifts) {
              var updatedShiftParams = {
                user_id: 0,
                notes: ''
              };
              updatedShiftParams = returnColorizedShift(updatedShiftParams, shift.start_time);
              var reassignShiftToOpenAndRemoveNotesRequest = {
                "method": 'PUT',
                "url": "/2/shifts/" + shift.id,
                "params": updatedShiftParams
              };
              batchPayload.push(reassignShiftToOpenAndRemoveNotesRequest);
            }
            // Otherwise, we just delete the shift.
            else {
              var shiftDeleteRequest = {
                  "method": "delete",
                  "url": "/2/shifts/" + shift.id,
                  "params": {},
              };
              batchPayload.push(shiftDeleteRequest);
            }

            if (!deletedShiftInformation.regShifts[parentShiftID]) {
              var formattedStartTime = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseRegShiftToCancelPageStartDateFormat);
              var formattedEndTime = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseRegShiftToCancelPageEndDateFormat)
              deletedShiftInformation.regShifts[parentShiftID] = { start_time: formattedStartTime, end_time: formattedEndTime };
            }
          }
        }
        else if (shift.location_id === global.config.locationID.makeup_and_extra_shifts && shiftIDsOfMakeupShiftsToBeDeleted.indexOf(shift.id) != -1) {
          var params = {
            user_id : 0
          };
          param = returnColorizedShift(params, shift.start_time, true);
          var openShiftRequest = {
            method : 'PUT',
            url : '/2/shifts/' + shift.id,
            params : params
          };
          batchPayload.push(openShiftRequest);

          var formattedStartTime = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseMakeupShiftToCancelPageStartDateFormat);
          var formattedEndTime = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseMakeupShiftToCancelPageEndDateFormat);

          deletedShiftInformation.makShifts[shift.id] = { start_time: formattedStartTime, end_time: formattedEndTime };
        }
    });

    whenIWorkAPI.post('batch', batchPayload, function(response) {
      var templateData = {
        deletedShiftInformation: JSON.stringify(deletedShiftInformation),
        email: encodeURIComponent(req.query.email),
        token: req.query.token,
        url: 'https://app.wheniwork.com/'
      }

      var url = '/scheduling/shifts/delete-success?';
      for (var label in templateData) {
        url += label + '=' + templateData[label] + '&';
      }

      var response = {
        success: true,
        redirect: url
      };

      res.json(response);
    });
  });
}

module.exports = deleteShiftsAndRedirect;
