'use strict';

function composeEmail (user, trainer) {

  const salutation = `<p> Hi ${user}, </p>`;
  const closing = `<p> ${trainer} </p>`;

  const body =
    `<p> I’m bummed that training now isn’t a good time for you. But life happens, I get it! </p>` +
    `<p>` + `I’d love to see you in one of our upcoming cohorts (I know you have what it takes to be an amazing Crisis Counselor!). You can sign up for a future cohort <a href="https://online.crisistextline.org/training/get-ready">here</a>. If none of these dates work, you can reapply once the timing is better for you. For many trainees, having time to reflect and practice self-care before rejoining makes training more manageable and enjoyable. </p>` +
    `Please fill out this two question survey to tell us why you are unable to complete our training program. We’re always looking to improve! https://goo.gl/forms/VDU2OCCUPVE1p7rp1` +
    `<p> Thanks, </p>`;

  return salutation + body + closing;

}

module.exports = composeEmail;
