'use strict';

const express = require('express');
const canvas = require(CONFIG.root_dir + '/canvas.js');
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

  retrieveUserCourseAssignmentIds(user.email, assignment, logErrEmailHeather)
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
  const usersThatHaveErrors = {};

  retrieveUserCourseAssignmentIds(emailWithSubmission.email, assignment, logErrEmailHeather)
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
    // Limit number of emails sent for the same user Erroring. 
    if (usersThatHaveErrors[emailWithSubmission.email] > 1) {
      CONSOLE_WITH_TIME(message);
      res.status(202).send({message});
    } else {
      usersThatHaveErrors[emailWithSubmission.email] = 1;
      CONSOLE_WITH_TIME(message);
      res.status(500).send({message});
    }
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

function retrieveUserCourseAssignmentIds(userEmail, assignment, errFunc){
  let promiseUserID;
  let promiseCourseID;
  let promiseAssignmentID;

  // request canvas user with this email address and find their userId
  promiseUserID = canvas.getUsers(userEmail)
    .then((users) => {
      if (users.length === 0) throw 'No user was found in Canvas for that email.';
      return users[0].id;
    });

  let userCanvasID;
  // request courses and find correct courseId;
  promiseCourseID = promiseUserID
    .then((userID) => {
      userCanvasID = userID;
      return canvas.getEnrollment(userID);
    })
    .then((courses) => {
      courses = courses.filter((course) => {
        return course.enrollment_state === 'active';
      });
      if (courses.length === 0) throw 'No active courses for user ${userCanvasID} were found in Canvas.';
      return courses[0].course_id;
    });

  // request assignments for course and find correct assignment
  promiseAssignmentID = promiseCourseID.then((courseID) => {
    return canvas.getAssignments(courseID, assignment);
    })
    .then(assignments => {
      if (assignments.length === 0) throw `Canvas returned 0 assignments`;
      return assignments[0].id;
    });

  return Promise.all([promiseUserID, promiseCourseID, promiseAssignmentID]).catch(err => {
      const subject = `Error finding ${assignment} in course found for ${userEmail}`;
      errFunc(subject, err);
    });
}


module.exports = {router};
