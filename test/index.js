

global.config = require('../config.js');
var sampleData = require('./sampleData.js');
var colorize = require('./colorize.js');
var loginusercreation = require('./loginusercreation.js');
var retrieveAndRenderShiftsToDelete = require('./retrieveAndRenderShiftsToDelete.js');
var whenIWorkUnofficialAPI = require('./whenIWorkUnofficialAPI.js');
var api = require('../www/scheduling/initWhenIWorkAPI');
var helpers = require(global.config.root_dir + '/www/scheduling/helpers');
var stathat = require(global.config.root_dir + '/lib/stathat.js');
var timezone = require('./timezone.js');
