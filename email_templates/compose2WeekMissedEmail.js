'use strict';

function composeEmail (user) {
  const intro = `<div>` +
    `<p> Hey ${user.first_name}! </p>` +
    `<p> We really misss you! Please lot back on the platform at </p>` +
    `<p> If you have any questions or concerns please reach out... </p>` +
  `</div>`;

  return intro;
}

module.exports = composeEmail;