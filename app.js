global.config = require('./config');

if (process.env.NODE_ENV === 'production') {
    require('newrelic');
}
else {
    global.config.locationID.regular_shifts = global.config.locationID.test;
}

var debug = require('debug')('my-application');
var app = require('./www/app');
var jobs = require('require-all')(__dirname + '/jobs');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
