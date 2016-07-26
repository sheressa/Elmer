'use strict';
const express = require('express');
const router = express.Router();

const timeOffRequests = require(`${CONFIG.root_dir}/tasks/timeOffRequests.js`).timeOffRequests;
router.get('/wiw/timeoff', function (req, res) {
  const options = {
    endTimeDate: req.query.endTimeDate,
    daysBack: req.query.daysBack,
  };
  if (KEYS.dataRoute && req.query.token === KEYS.dataRoute) {
    timeOffRequests(options, (CSVString) => {
      res.send(CSVString);
    });
  }
  else res.status(403).send('Access denied.');
});

module.exports = {router};