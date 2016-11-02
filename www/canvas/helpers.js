'use strict';

const ctlOnline = require('../../ctlOnline.js');

function extractEmailAndFormatSubmission (formResponse) {
  const emailWithSubmission = {};
  const answers = {};

  formResponse.answers.forEach(answer => {
    if (answer.type === 'email') emailWithSubmission.email = answer.email;

    if (answer.type === 'boolean') {
      answers[answer.field.id] = answer[answer.type] ? 'Yes' : 'No';
    } else if (answer.type === 'choice') {
      answers[answer.field.id] = answer[answer.type].label;
    } else if (answer.type === 'choices') {
      answers[answer.field.id] = answer[answer.type].labels.join(', ');
    } else if (typeof answer[answer.type] === 'object') {
      answers[answer.field.id] = JSON.stringify(answer[answer.type]);
    } else {
      answers[answer.field.id] = answer[answer.type];
    }
  });

  // let qWithBolding = '';

  // TODO A typeform error is causing formResponse.definition = null;
  // const pairedQtoA = formResponse.definition.fields
  //                     .sort((a,b) => a.title.localeCompare(b.title))
  //                     .map(formatHTML);

  // function formatHTML (question, idx) {
  //   qWithBolding = question.title.replace('Texter: ', '<b>Texter: </b>');
  //   return `<h1>${idx}: ${qWithBolding}</h1>` +
  //   `<h2><b>Crisis Counselor: </b>${answers[question.id]}</h2>`;
  // }
  
  // emailWithSubmission.submissionHTML = `<p> ${pairedQtoA.join('</p><br><p>')} </p>`;

  // TODO This is a temporary fix for submissions until typeform solves their Webhook issue
  emailWithSubmission.submissionHTML = `<p>${formResponse.answers.map(elem => JSON.stringify(elem)).join('</p><br><p>')}</p>`;

  return emailWithSubmission;
}

// Using this object because I believe we will have more triggers 
// based on assignment names provided by the typeform webhook
const triggersBasedOnAssignment = {
  'Full Roleplay': function(email) {
    return ctlOnline.uidFromEmail(email)
      .then(uid => {
        return ctlOnline.addCC1Role(uid);
      }).catch(err => {
        CONSOLE_WITH_TIME(`[ERROR] in triggersBasedOnAssignment 'Full Roleplay': ${err}`);
      });
  }
};

module.exports = {extractEmailAndFormatSubmission, triggersBasedOnAssignment};