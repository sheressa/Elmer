'use strict';

const express = require('express');
const api = CONFIG.WhenIWork;

const retrieveAndRenderShiftsToDelete = require('./controllers/retrieveAndRenderShiftsToDelete');
const deleteShiftsAndRedirect = require('./controllers/deleteShiftsAndRedirect');
const retrieveShiftsAndOwnersWithinTimeInterval = require('./controllers/retrieveShiftsAndOwnersWithinTimeInterval');
const renderShiftDeleteSuccess = require('./controllers/renderShiftDeleteSuccess');

const router = express.Router();

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
