'use strict';

function composeEmail (user) {
  // This is a sample email that needs to be updated by Rachel
  const intro = `<div>` +
    `<p> Hey ${user.first_name}! </p>` +
    `<p> We have hundreds of texters every hour that need your support and we really miss you!! </p>` +
    `<p> Please log back on the platform at https://online.crisistextline.org/ </p>` +
    `<p> If you have any questions or concerns please reach out to us at support@crisistextline.org!</p>` +
  `</div>`;

  return intro;
}

module.exports = composeEmail;