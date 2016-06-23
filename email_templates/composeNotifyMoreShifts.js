var moment = require('moment');
var date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

function composeEmail (user, shiftToSup) {
  var body = composeSupTiles(user.shifts[0], shiftToSup);

  var shifts = [];

  user.shifts.forEach(function(shift){
    shifts.push(moment(shift, date_format).format("dddd, MMMM Do YYYY, h:mm a") + " ET");
  });

  shifts = shifts.join('</p> <p>');

  var intro = "<div>" +
    "<p> Hey " + user.firstName + "! </p>" +
    "<p> Woohoo! You signed up for " + user.shifts.length + " weekly shifts. We've got you down for: </p>" +
    "<p>"+ shifts + "</p>" +
    "<p> As promised, you'll be in good hands. Here are the supervisors who will have your back on your first shift: </p>" +
    "<div style='display: flex; text-align:center'>";

  var conclusion = "</div>" +
   "<p> Our supervisors are amazeballs. They're also human beings who take vacations and get sick - if your super above isn’t online for your shift, don't fret. You’ll be in good hands with someone else on our team. Here are a few pro tips for the platform: </p>" +
    "<ul>" +
      "<li>Your supervisor's name is on the upper left corner of your screen (click it and say hello!)</li>" +
      "<li>Enter your status under your name (suggestion: &#34First Shift&#34 - or some funky version of this, so your fellow crisis counselors know to say hi!)</li>" +
      "<li>Only take 1 conversation at a time</li>" +
      "<li>NEVER feel like you are alone, your peers and supervisors are there to help!</li>" +
      "<li>Say hi to everyone in the Global Chat let them know you are new - join the convo (it's a fun crew!)</li>" +
      "<li>If you need to make any changes to your schedule, or aren't able to make your first shift please visit CTL Online and click on &#34Shift Scheduling&#34.</li>" +
    "</ul> " +
    "<p> Taking your first shift is the last step in becoming a bona fide Crisis Counselor! You got this!</p>" +
    "<p> Enjoy your first shift, </p> " +
    "<p> The Crisis Text Line Training Team </p>" +
  "</div>";

  return intro + body + conclusion;
}

function composeSupTiles (shift, shiftToSup) {
  var supTileHTML = '';
  // Supervisors schedule shifts every 4 hours, CCs every 2 hours so check both supervisor slots
  // Technically I should be checking to see which supervisors started within the last 4 hours.
  // TODO make this more robust...
  var altShift = moment(shift, date_format).subtract(2, 'hours').format(date_format);

  if (shiftToSup[shift]) shiftToSup[shift].forEach(addText);
  if (shiftToSup[altShift]) shiftToSup[altShift].forEach(addText);

  function addText (sup){
    var fullName = sup.first + " " + sup.last;
    supTileHTML += '<div style="padding: 10px; border:1px solid black; width:160px; margin: 10px;">' +
    fullName + ' <br> ' +
    '<img src=' + sup.imgURL + ' alt="'+ fullName+ '" height="150" width="150">' +
    '</div>';
  }

  return supTileHTML;
}

module.exports = composeEmail;

