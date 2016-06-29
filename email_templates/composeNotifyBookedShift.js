var moment = require('moment');
var date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

function composeEmail (user, shiftToSup) {
  var body = composeSupTiles(user.shift, shiftToSup);

  var shift = moment(user.shift, date_format).format("dddd, MMMM Do YYYY, h:mm a") + " ET";

  var intro = "<div>" +
    "<p> Hey " + user.first_name + "! </p>" +
    "<p> Woohoo! You signed up for a new weekly shift at " + shift + " .</p>" +
    "<p> These are the supervisors who will have your back on the platform: </p>" +
    "<div style='display: flex; text-align:center'>";

  var conclusion = "</div>" +
   "<p> Our team of supervisors is amazeballs. We're also human beings who take vacations and get sick - if your super above isn't online for your shift, don't fret. You'll be in good hands with someone else on our team. </p>" +
    "<p> Enjoy your shift, </p> " +
    "<p> The Crisis Text Line Supervisors </p>" +
  "</div>";

  return intro + body + conclusion;
}

function composeSupTiles (shift, shiftToSup) {
  var supTileHTML = '';
  // Supervisors schedule shifts every 4 hours, CCs every 2 hours so check both supervisor slots

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

