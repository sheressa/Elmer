'use strict';

const express = require('express');
const canvas = require(CONFIG.root_dir + '/jobs/scheduling/helpers/updateCanvas.js').canvas;
const stathat = require(CONFIG.root_dir + '/lib/stathat');
const router = express.Router();

const helpers = require(`${CONFIG.root_dir}/www/canvas/helpers.js`);
const mandrill = require('mandrill-api/mandrill');
const mandrillClient = new mandrill.Mandrill(KEYS.mandrill.api_key);

router.put('/firstShift', function (req, res) {
  const assignment = CONFIG.canvas.assignments.attendedFirstShift;
  const user = req.body.user;

  const logErrEmailHeather = createLogErrEmailHeatherFunc(`platform user:` +
        `${JSON.stringify(user)} was not able to be given credit for ${assignment}`);

  canvas.retrieveUserCourseAssignmentIds(user.email, assignment, logErrEmailHeather)
  .then(responses => {
    // responses is [userID, courseID, assignmentID] so we spread it
    return canvas.updateUserGrade(...responses, 'complete');
  })
  .then(() => res.send({message: `Successfully updated ${user.email}`}))
  .catch((err) => {
    const message = `Updating ${assignment} for ${user.email} in Canvas failed: ${err}`;
    CONSOLE_WITH_TIME(message);
    // Using 206 instead of 500 to get through Platform Try Catch
    res.status(206).send({message});
  });

  stathat.increment('Canvas - Attend First Shift', 1);
});

router.post('/typeformAssignment/:assignment', function (req, res) {
  const formResponse = req.body.form_response;
  const emailWithSubmission = helpers.extractEmailAndFormatSubmission(formResponse);
  const assignment = req.params.assignment;
  const logErrEmailHeather = createLogErrEmailHeatherFunc(`typeform submission for email:` +
        `${emailWithSubmission.email} was not able to be given credit for ${assignment}`);

  canvas.retrieveUserCourseAssignmentIds(emailWithSubmission.email, assignment, logErrEmailHeather)
  .then(responses => {
    // responses is [userID, courseID, assignmentID] so we spread it
    const pSubmitAssign = canvas.submitAssignment(...responses, emailWithSubmission.submissionHTML);

    // If updateUserGrade after submitAssignment then Canvas marks the assignment as graded
    // we need updateUserGrade to run first so that Canvas alerts trainers to grade the submission
    if (formResponse.calculated && formResponse.calculated.score) {
      return canvas.updateUserGrade(...responses, formResponse.calculated.score)
        .then(() => pSubmitAssign);
    } else {
      return pSubmitAssign;
    }
  }).then(() => {
    if (helpers.triggersBasedOnAssignment[assignment]) {
      return helpers.triggersBasedOnAssignment[assignment](emailWithSubmission.email);
    }
  })
  .then(() => res.send({message: `Successfully submitted ${assignment} with ${JSON.stringify(emailWithSubmission)}`}))
  .catch((err) => {
    const message = `Submitting ${assignment} for ${emailWithSubmission.email} in Canvas failed: ${err}`;
    CONSOLE_WITH_TIME(message);
    res.status(500).send({message});
  });
});


function createLogErrEmailHeatherFunc (messageText) {

  return (subject, err) => {
    CONSOLE_WITH_TIME(`${subject}: ${err}`);

    const message = {
      subject: subject,
      text: `Hi Heather, Due to the error specified in the subject ` + messageText,
      from_email: 'support@crisistextline.org',
      from_name: 'Crisis Text Line',
      to: [{
          email: 'heather@crisistextline.org',
          name: 'Heather',
          type: 'to'
      }]
    };

    mandrillClient.messages.send({message: message, key: 'canvas_user_not_found'}, function (res) {
        CONSOLE_WITH_TIME(res);
    });
  };
  
}


module.exports = {router};
