'use strict';

const moment = require('moment');
const dateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
const composeSupTiles = require('./createSupervisorTiles.js');

function composeEmail (user, shiftToSup) {
  const body = composeSupTiles(user.shift, shiftToSup);

  const shift = moment(user.shift, dateFormat).format('dddd, MMMM Do YYYY, h:mm a') + ' ET';

  const intro = `<div>` +
    `<p> Hey ${user.first_name}! </p>` +
    `<p> Woohoo! You signed up for a new weekly shift at ${shift}.</p>` +
    `<p> These are the supervisors who will have your back on the platform: </p>` +
    `<div style='display: flex; text-align:center'>`;

  const conclusion = `</div>` +
   `<p> Our team of supervisors is amazeballs. We're also human beings who take vacations and get sick - if your super above isn't online for your shift, don't fret. You'll be in good hands with someone else on our team. </p>` +
    `<p> Enjoy your shift, </p>` +
    `<p> The Crisis Text Line Supervisors </p>` +
  `</div>`;

  return intro + body + conclusion;
}

module.exports = composeEmail;

