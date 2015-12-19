var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');
var fs = require('fs');

var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(global.config.mandrill.api_key);

var interval = 20;
var date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

new CronJob('0 */'+interval+' * * * *', function () {
    checkNewShifts();
}, null, true);

checkNewShifts();

function checkNewShifts() {

    WhenIWork.get('users', function (users) {
        var now = moment();
        var template = fs.readFileSync('./email_templates/shift_welcome.txt', {encoding: 'utf-8'});

        for (var i in users.users) {
            var u = users.users[i];
            var created = moment(u.created_at, date_format);

            if (u.notes.indexOf('first_shift_notified') < 0 && now.diff(created, 'days') < 7) {
                var q = {
                    user_id: u.id,
                    start: moment().format(date_format),
                    end: moment().add(7, 'days').format(date_format)
                };

                WhenIWork.get('shifts', q, function (shifts) {
                    var sent = false;

                    for (var i in shifts.shifts) {
                        var s = shifts.shifts[i];
                        var created = moment(s.created_at, date_format);

                        if (now.diff(created, 'minutes') <= interval && !sent) {
                            var sent = true;
                            var shift_start = moment(s.start_time, date_format).format('MMM D, YYYY HH:mm');

                            var content = template.replace('%name', shifts.users[0].first_name).replace('%date', shift_start);

                            var message = {
                                subject: 'Welcome aboard!',
                                text: content,
                                from_email: 'support@crisistextline.org',
                                from_name: 'Crisis Text Line',
                                to: [{
                                    email: shifts.users[0].email,
                                    name: shifts.users[0].first_name + ' ' + shifts.users[0].last_name,
                                    type: 'to'
                                }],
                                headers: {
                                    "Reply-To": "shannon@crisistextline.org",
                                }
                            };

                            mandrill_client.messages.send({message: message, key: 'first_shift_scheduled'}, function (res) {
                                console.log(res);
                            });

                            WhenIWork.update('users/'+shifts.users[0].id, {notes: shifts.users[0].notes + 'first_shift_notified' + "\n"});
                        }
                    }
                });
            }
        }
    });
}
