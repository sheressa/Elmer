'use strict';

function extractEmailAndFormatSubmission (formResponse) {
  const emailWithSubmission = {};
  const answers = {};

  formResponse.answers.forEach(answer => {
    if (answer.type === 'email') emailWithSubmission.email = answer.email;

    if (answer.type === 'boolean') {
      if(answer[answer.type]) answers[answer.field.id] = 'Yes';
      else answers[answer.field.id] = 'No';
    } else {
      answers[answer.field.id] = answer[answer.type];
    }
  });

  let qWithBolding = '';

  const pairedQtoA = formResponse.definition.fields
                      .sort((a,b) => a.id-b.id)
                      .map(formatHTML);

  function formatHTML (question, idx) {
    qWithBolding = question.title.replace('Texter: ', '<b>Texter: </b>');
    return `<h1>${idx}: ${qWithBolding}</h1>` +
    `<h2><b>Crisis Counselor: </b>${answers[question.id]}</h2>`;
  }
  
  emailWithSubmission.submissionHTML = `<p> ${pairedQtoA.join('</p><br><p>')} </p>`;

  return emailWithSubmission;
}


module.exports = {extractEmailAndFormatSubmission};