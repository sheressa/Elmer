global.CONFIG = require('../../config.js');
global.KEYS = require('../../keys.js')
var Request = require('request-promise');
var WhenIWork = CONFIG.WhenIWork;
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);
var options = {
  headers: {
    Authorization: KEYS.canvas.api_key,
    'User-Agent': 'Request-Promise'
  }
};
var canvas = {};

//finds all canvas courses
canvas.scrapeCanvasCourses = function() {

  options.url = 'https://crisistextline.instructure.com/api/v1/accounts/1/courses?per_page=1000';

  return Request(options)
  .then(function(response){
    if (response === '[]') throw 'No courses found.';
    response = JSON.parse(response);
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Canvas call to get courses failed: ', err);
  });

};

//finds all enrollments in a given course
canvas.scrapeCanvasEnrollment = function(courseID, enrollmentState) {

  options.url = 'https://crisistextline.instructure.com/api/v1/courses/' + courseID + '/enrollments?state[]=' + enrollmentState;

  return Request(options)
  .then(function(response){
    response = JSON.parse(response);
    return response;
  })
  .catch(function(err){
    CONSOLE_WITH_TIME("Finding enrollments for the course with ID " + courseID + " in Canvas failed: ", err);
  });

};

canvas.emailDroppedUser = function(user) {
  var message = {
    subject: 'Melted',
    html: 'You got melted, son.',
    from_email: 'support@crisistextline.org',
    from_name: 'Crisis Text Line',
    to: [{
        email: user.login_id,
        name: user.name,
        type: 'to'
    }],
    headers: {
        "Reply-To": "support@crisistextline.org",
    }
  };

  mandrill_client.messages.send({message: message}, CONSOLE_WITH_TIME);

  //the below is returned for testing purposes
  return message;
};

deleteWiWUserAndShifts = function(canvasUser) {
  var usersForTest;
  WhenIWork.get('users', CONFIG.locationID.regular_shifts, function(users) {
    users = users.users.filter(function(user) {
      return user.email == canvasUser.login_id;
    });
    users = users.map(function(user) {
      return user.id;
    });
    for (var userID in users) {
      // WhenIWork.delete('users', {id: userID, delete_shifts: false}, function(result) {
      //   CONSOLE_WITH_TIME("Successfully deleted user: ", result);
      // });
    }
    usersForTest = users;
  });
  return usersForTest;
};

function findMeltedCanvasUsersEmailThemAndDeleteThemInWiW() {
  canvas.scrapeCanvasCourses()
  .then(function(response) {
    var result = response.map(function(course) {
      return course.id;
    });
    return result;
  })
  .then(function(courseIDs) {
    courseIDs.forEach(function(courseID) {
      return canvas.scrapeCanvasEnrollment(courseID, 'inactive')
      .then(function(enrollments) {
        enrollments.forEach(function(enrollment) {
          //take user object here and delete user's WiW shifts + account, email person
          canvas.emailDroppedUser(enrollment.user);
          deleteWiWUserAndShifts(enrollment.user);
        });
      });
    });
  })
  .catch(function(err) {
    console.log('Error finding Canvas users or deleting them in WiW', err);
  });
}

findMeltedCanvasUsersEmailThemAndDeleteThemInWiW();

module.exports = {deleteWiWUserAndShifts: deleteWiWUserAndShifts, findMeltedCanvasUsersEmailThemAndDeleteThemInWiW: findMeltedCanvasUsersEmailThemAndDeleteThemInWiW, canvas: canvas};

