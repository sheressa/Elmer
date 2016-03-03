// TODO: pick an assertion library. @tong!
var c = require('../lib/ColorizeShift');
var df = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var moment = require('moment');

var t1 = moment(1456995600000);
var t2 = moment(1457017200000);

var s1 = {
    start_time: t1.format(df)
};

var s2 = {
    start_time: t2.format(df)
};

console.log(c(s1));
console.log(c(s2));
console.log(c({}, t1));
console.log(c({}, t2));
