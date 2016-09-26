'use strict';

function composeEmail (user, trainer) {

  const salutation = `<p> Hi ${user}, </p>`;
  const closing = `<p> ${trainer} </p>`;

  const body =
    `<p> I’m following up from my email last week. I know training is a lot of work and you’re a do-gooder (aka you say yes to lots all at once — like me!). Since you’re still a bit behind on checkpoints, it seems this may not be the right time in your life to add something to your plate. </p>` +
    `<p> When you feel the timing is better, we’d love to have you re-apply. </p>` +
    `<p> Thanks, </p>`;

  return salutation + body + closing;

}

module.exports = composeEmail;
