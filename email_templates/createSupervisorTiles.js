'use strict';

const moment = require('moment');
const dateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

function composeSupTiles (shift, shiftToSup) {
  let supTileHTML = '';
  // Supervisors schedule shifts every 4 hours, CCs every 2 hours so check both supervisor slots

  const altShift = moment(shift, dateFormat).subtract(2, 'hours').format(dateFormat);

  if (shiftToSup[shift]) shiftToSup[shift].forEach(addText);
  if (shiftToSup[altShift]) shiftToSup[altShift].forEach(addText);

  function addText (sup){
    const fullName = `${sup.first} ${sup.last}`;
    supTileHTML += `<div style='padding: 10px; border:1px solid black; width:160px; margin: 10px;'>` +
    `${fullName} <br> ` +
    `<img src=${sup.imgURL} alt='${fullName}' height='150' width='150'>` +
    `</div>`;
  }

  return supTileHTML;
}

module.exports = composeSupTiles;