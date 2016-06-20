//This file allows us to require everything in at once,
//rather than again and again at the start of each test file.
//It is meant to run with npm test.
//This file will run before all other test files, as the console.log shows.
console.log('index file running');
process.env.NODE_ENV = 'test';
global.KEYS = require('../keys.js');
global.CONFIG = require('../config.js');
//tests
var colorize = require('./colorize.js');
var loginUserCreation = require('./loginUserCreation.js');
var retrieveAndRenderShiftsToDelete = require('./retrieveAndRenderShiftsToDelete.js');
var whenIWorkUnofficialAPI = require('./whenIWorkUnofficialAPI.js');
var timezone = require('./timezone.js');
var deleteShiftsAndRedirect = require('./deleteShiftsAndRedirect.js');
var renderShiftDeleteSuccess = require('./renderShiftDeleteSuccess.js');
var mergeOpenShifts = require('./mergeOpenShifts.js');
var notifyFirstShift = require('./notifyFirstShift.js');
var notifyMoreShifts = require('./notifyMoreShifts.js');
var timeOffRequests = require('./timeOffRequests');
