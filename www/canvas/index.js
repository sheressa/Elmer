'use strict';

const express = require('express');
const canvas = require(CONFIG.root_dir + '/jobs/scheduling/helpers/updateCanvas.js').canvas;
const stathat = require(CONFIG.root_dir + '/lib/stathat');
const router = express.Router();

const mandrill = require('mandrill-api/mandrill');
const mandrillClient = new mandrill.Mandrill(KEYS.mandrill.api_key);

router.put('/firstShift', function (req, res) {
  const assignment = CONFIG.canvas.assignments.attendedFirstShift;
  const user = req.body.user;
  let promiseUserID;
  let promiseCourseID;
  let promiseAssignmentID;

  // request canvas user with this email address and find their userId
  promiseUserID = canvas.scrapeCanvasUsers(user.email)
  .then((users) => {
    if (users.length === 0) throw 'No user was found in Canvas for that email.';
    return users[0].id;
  }).catch(err => {
    const subject = `Error finding user with email ${user.email} in Canvas`;
    logErrEmailHeather(subject, err, user, assignment);
  });

  // request courses and find correct courseId;
  promiseCourseID = promiseUserID.then((userID) => {
    return canvas.scrapeCanvasEnrollment(userID);
    })
    .then((courses) => {
    courses = courses.filter((course) => {
      return course.enrollment_state === 'active';
    });
    if (courses.length === 0) throw 'No active courses for that user were found in Canvas.';
    return courses[0].course_id;
  }).catch(err => 
    CONSOLE_WITH_TIME(`Error finding active course for ${user.email}: ${err}`)
  );

  // request assignments for course and find correct assignment
  promiseAssignmentID = promiseCourseID.then((courseID) => {
    return canvas.scrapeCanvasAssignments(courseID, assignment);
  })
  .then(assignments => {
    if (assignments.length === 0) throw `Canvas returned 0 assignments`;
    return assignments[0].id;
  }).catch(err => {
    const subject = `Error finding ${assignment} in course found for ${user.email}`;
    logErrEmailHeather(subject, err, user, assignment);
  });


  Promise.all([promiseUserID, promiseCourseID, promiseAssignmentID])
  .then(responses => {
    // responses is [userID, courseID, assignmentID] so we spread it
    return canvas.updateUserGrade(...responses, 'complete');
  })
  .then(() => res.send(`Successfully updated ${user.email}`))
  .catch((err) => {
    const message = `Updating ${assignment} for ${user.email} in Canvas failed: ${err}`;
    CONSOLE_WITH_TIME(message);
    res.status(500).send(message);
  });

  stathat.increment('Canvas - Attend First Shift', 1);
});

function logErrEmailHeather (subject, err, user, assignment) {
  CONSOLE_WITH_TIME(`${subject}: ${err}`);

  const message = {
    subject: subject,
    text: `Hi Heather, Due to the specified error in the subject platform user:` +
      `${JSON.stringify(user)} was not able to be given credit for ${assignment}`,
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

}

module.exports = {router};
