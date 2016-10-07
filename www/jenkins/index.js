'use strict';
const express   = require('express');
const router = express.Router();
const app = express();
const bodyParser = require('body-parser');
const removeChurned = require('./removeChurned.js');

router.use(bodyParser.text());

router.use(function (req, res, next) {
  if (checkToken(req.query.token)) {
    return next();
  }
  else res.status(403).send('Access denied.');
});

function checkToken (token) {
  return (KEYS.jenkinsRoute && token === KEYS.jenkinsRoute);
}

router.use('/churned', removeChurned);


module.exports = {router};