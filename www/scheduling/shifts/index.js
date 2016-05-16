var express = require('express')
  , WhenIWork = require('wheniwork-unofficial')
  , api = require('../initWhenIWorkAPI')
  , moment = require('moment')
  , sha1 = require('sha1')
  , helpers = require(global.config.root_dir + '/www/scheduling/helpers')
  ;

var retrieveAndRenderShiftsToDelete = require('./controllers/retrieveAndRenderShiftsToDelete')
  , deleteShiftsAndRedirect = require('./controllers/deleteShiftsAndRedirect')
  , retrieveShiftsAndOwnersWithinTimeInterval = require('./controllers/retrieveShiftsAndOwnersWithinTimeInterval')
  , renderShiftDeleteSuccess = require('./controllers/renderShiftDeleteSuccess')
  ;

var router = express.Router();

var wiwDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ'
  , chooseRegShiftToCancelPageStartDateFormat = 'dddd h:mm a' // Wednesday 4:00 p
  , chooseRegShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , chooseMakeupShiftToCancelPageStartDateFormat = 'dddd, MMM Do YYYY - h:mm a' // Wednesday, Mar 30th 2016 - 4:00 p
  , chooseMakeupShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , scheduleShiftsURL = '/scheduling/login?'
  ;

router.get('/', function(req, res) {
  retrieveAndRenderShiftsToDelete(req, res, api);
});

router.delete('/', function(req, res) {
  deleteShiftsAndRedirect(req, res, api);
});

router.get('/delete-success', function(req, res) {
  renderShiftDeleteSuccess(req, res);
});

/**
  Retrieves the shifts and owners' email addresses which fall within a requested
  time interval.
**/
router.get('/time-interval', function(req, res) {
  retrieveShiftsAndOwnersWithinTimeInterval(req, res, api);
});

module.exports = router;
