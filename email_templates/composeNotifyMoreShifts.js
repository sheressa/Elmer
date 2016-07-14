'use strict';

const moment = require('moment');
const dateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
const composeSupTiles = require('./createSupervisorTiles.js');

function composeEmail (user, shiftToSup) {
  const body = composeSupTiles(user.shifts[0], shiftToSup);

  const shift = moment(user.shifts[0], dateFormat).format('dddd, MMMM Do YYYY, h:mm a') + ' ET';

  const intro = `<div>` +
    `<p> Hey ${user.firstName}! </p>` +
    `<p> Woohoo! You signed up for your first shift. We've got you down for: </p>` +
    `<p>${shift}</p>` +
    `<p> As promised, you'll be in good hands. Here are the supervisors who will have your back on your first shift: </p>` +
    `<div style='display: flex; text-align:center'>`;

  const conclusion = `</div>` +
   `<p> Our supervisors are amazeballs. They're also human beings who take vacations and get sick - if your super above isn’t online for your shift, don't fret. You’ll be in good hands with someone else on our team. Here are a few pro tips for the platform: </p>` +
    `<ul>` +
      `<li>Your supervisor's name is on the upper left corner of your screen (click it and say hello!)</li>` +
      `<li>Enter your status under your name (suggestion: "First Shift" - or some funky version of this, so your fellow crisis counselors know to say hi!)</li>` +
      `<li>Only take 1 conversation at a time</li>` +
      `<li>NEVER feel like you are alone, your peers and supervisors are there to help!</li>` +
      `<li>Say hi to everyone in the Global Chat let them know you are new - join the convo (it's a fun crew!)</li>` +
      `<li>If you need to make any changes to your schedule, or aren't able to make your first shift please visit CTL Online and click on "Shift Scheduling".</li>` +
    `</ul> ` +
    `<p> Taking your first shift is the last step in becoming a bona fide Crisis Counselor! You got this!</p>` +
    `<p> Enjoy your first shift, </p> ` +
    `<p> The Crisis Text Line Training Team </p>` +
  `</div>`;

  return intro + body + conclusion;
}

module.exports = composeEmail;

