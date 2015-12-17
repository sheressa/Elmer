var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');

new CronJob('* * * * * *', function () {
    WhenIWork.get('users', function (users) {
        console.log(users);
    });
}, null, true);
