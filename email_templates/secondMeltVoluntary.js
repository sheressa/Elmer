'use strict';

function composeEmail (user, trainer) {

  const salutation = `<p> Hi ${user}, </p>`;
  const closing = `<p> ${trainer} </p>`;

  const body =
    `<p> I’m sorry to see you leave this training cohort! I understand you’ve got a lot going on and this may not be the best time to add something to your plate. </p>` +
    `<p> You’ve impressed me with your crisis counseling skills so far. I’d love to see you in a future cohort when timing works better! You can apply to rejoin <a href="http://www.crisistextline.org/join-our-efforts/volunteer/">here</a>. </p>` +
    `<p> Thanks, </p>`;

  return salutation + body + closing;

}

module.exports = composeEmail;
