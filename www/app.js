'use strict';

//REQUIRING KEYS BEFORE CONFIG BECAUSE CONFIG DEPENDS ON KEYS
global.KEYS = require('../keys.js');
global.CONFIG = require('../config');
const cache = require('../cache.js');
if (process.env.NODE_ENV !== 'production') {
  CONFIG.locationID.regular_shifts = CONFIG.locationID.test;
}
else {
  require('newrelic');
}

const express = require('express');
const path = require('path');
const favicon = require('static-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const debug = require('debug')('my-application');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));

app.use('/jenkins',require('./jenkins').router); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

(function CacheInit(){
  if (global.USERS_CACHE) return;
  cache()
  .then(function(users){
    global.USERS_CACHE = users;
    CONSOLE_WITH_TIME(users[0]);
  })
  .catch(function(error){
    CONSOLE_WITH_TIME('error showing up from cache initialization');
    console.error(error);
    CacheInit();
  })
})();

app.use('/scheduling', require('./scheduling').router);
app.use('/canvas', require('./canvas').router);
app.use('/data', require('./data').router);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});

module.exports = app;
