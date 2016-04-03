global.config = require('./config');
require('newrelic');

if (process.env.NODE_ENV !== 'production') {
    global.config.locationID.regular_shifts = global.config.locationID.test;
    global.config.locationID.makeup_and_extra_shifts = global.config.locationID.test2;
}

var debug = require('debug')('my-application');
var app = require('./www/app');
var jobs = require('require-all')(__dirname + '/jobs');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
