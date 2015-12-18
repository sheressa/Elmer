var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');

new CronJob('* * * * * *', function () {
    getShifts();
}, null, true);

function getShifts() {
    var now = new moment();
    now.day('Sunday').day(7).hour(0).minute(0).day(0).seconds(0);
    var next = now.clone().day(7);

    console.log(now);
    console.log(next);
}

