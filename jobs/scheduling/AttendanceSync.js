var CronJob = require('cron').CronJob;
var canvas = require('../../canvas.js');
var bignumJSON = require('json-bignum');
var Request = require('request');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);
var fs = require('fs');

//runs cron job every day at 5am
new CronJob(CONFIG.time_interval.gtw_attendance_sync_with_canvas, function () {
   startJobByQueryingForGTWSessions();
}, null, true);
//invoking the function here runs the job every time the application starts
startJobByQueryingForGTWSessions();
//gets all webinar sessions in a specified time period
function startJobByQueryingForGTWSessions(){
  var keysArr = [];
  var time = urlTime();
  var endTime = time.endDate;
  var startTime = time.startDate;

	var url = 'https://api.citrixonline.com/G2W/rest/organizers/'+KEYS.GTW.org_id+'/sessions?fromTime='+startTime+'&toTime='+endTime;
	var options = {
  		url: url,
  		headers: {
  		Accept: 'application/json',
    	Authorization: KEYS.GTW.api_key
      }
	};

	function callback(error, response, body) {
  		if (!error && response.statusCode == 200) {
        //we need bignumJSON because JS rounds GTW session ids otherwise
	   		var GTWSessions = bignumJSON.parse(body);
        if (GTWSessions.length===0){
          CONSOLE_WITH_TIME('NO SESSIONS DURING', startTime, 'and', endTime, '!');
          return;
        }
	   		GTWSessions.forEach(function(webinar){
	   			keysArr.push({webinarKey: webinar.webinarKey.toString(), sessionKey: webinar.sessionKey.toString()});
	   		});
	   		queryForGTWAttendees(keysArr);
  		} else {
  			CONSOLE_WITH_TIME("GTW get all webinars error message: ", body);
  		}
	}

	Request.get(options, callback);
}

//gets all webinar attendees for each session then calls a user processing function
function queryForGTWAttendees(keysArr){

	function callback(error, response, body) {
  		if (!error && response.statusCode == 200) {
	   		var GTWAttendees = bignumJSON.parse(body);
	   		var newGTWUsers = checkForDupUsersInGTWFilterForThoseWhoAttendedLessThan90Mins(GTWAttendees);
        findCanvasUsersByEmail(newGTWUsers);
  		} else {
  			CONSOLE_WITH_TIME("GTW get all webinar attendees error message: ", body);
  		}
	}

	keysArr.forEach(function(id){
		var url = 'https://api.citrixonline.com/G2W/rest/organizers/'+KEYS.GTW.org_id+'/webinars/'+id.webinarKey+'/sessions/'+id.sessionKey+'/attendees';
		var options = {
  		url: url,
  		headers: {
    	Authorization: KEYS.GTW.api_key
  			}
		};
		Request.get(options, callback);
	});
}

//removes duplicate emails, calculates attended time and filters out users who attended for less than 90 minutes.
function checkForDupUsersInGTWFilterForThoseWhoAttendedLessThan90Mins(arr){
	var userData;
  var GTWusers = [];

	arr.forEach(function(user, index){
		if (!userData){
		userData = {firstName: user.firstName, lastName: user.lastName, email: user.email, attendance: user.attendanceTimeInSeconds};
    } else {
      if (userData.email == user.email){
        userData.attendance+=user.attendanceTimeInSeconds;
      } else {
        if (userData.attendance>=CONFIG.GTW_attendance_minimum) {GTWusers.push(userData);}
        userData = {firstName: user.firstName, lastName: user.lastName, email: user.email, attendance: user.attendanceTimeInSeconds};
      }
    }
		if (arr.length-1==index && userData.attendance>=CONFIG.GTW_attendance_minimum){
			 GTWusers.push(userData);
		 }
	});
  //stops the script if GTWusers array is empty
  if (!GTWusers) { 
    CONSOLE_WITH_TIME('None of the scraped GTW users attended a webinar for 90 minutes or more.');
     return;
   } else {
      return GTWusers;
   } 
}

//scrapes canvas for user by email, course and assignment id's
function findCanvasUsersByEmail(GTWusers){
  var Uurl = 'https://crisistextline.instructure.com/api/v1/accounts/1/users';
  
  GTWusers.forEach(function(GTWUser){
    var emailQuery = {search_term: GTWUser.email};
    //query canvas for a user using user email
    canvas.scrapeCanvasU(Uurl, emailQuery)
    .then(function(canvasUsers){
      if (!canvasUsers.length) { 
        emailTrainer(GTWUser, 0);
        findCanvasUserByName(GTWUser);
        CONSOLE_WITH_TIME("COULD NOT FIND USER BY EMAIL: ", GTWUser);
        return;}

      if (canvasUsers.length>1){
        emailTrainer(GTWUser, 1);
        CONSOLE_WITH_TIME("TWO USERS WITH THE SAME EMAIL FOUND ", canvasUsers);
        return;}
      var userID = canvasUsers[0].id;
      queryForCanvasCoursesAndAssignments(userID);
    });
  });
}

//scrapes canvas for user by name, course and assignment id's
function findCanvasUserByName(GTWUser){
  var Uurl = 'https://crisistextline.instructure.com/api/v1/accounts/1/users',
  nameQuery = {search_term: GTWUser.firstName+' '+GTWUser.lastName};
    //query canvas for a user using user email
  canvas.scrapeCanvasU(Uurl, nameQuery)
  .then(function(canvasUsers){
    if (!canvasUsers.length) { 
      emailTrainer(GTWUser, 2);
      CONSOLE_WITH_TIME("COULD NOT FIND USER BY NAME: ", GTWUser);
      return;}

    if (canvasUsers.length>1){
      emailTrainer(GTWUser, 3);
      CONSOLE_WITH_TIME("TWO USERS WITH THE SAME NAME FOUND ", canvasUsers);
      return;}
    var userID = canvasUsers[0].id;
    queryForCanvasCoursesAndAssignments(userID);
  });
}

//scrapes canvas for user by name, course and assignment id's
function queryForCanvasCoursesAndAssignments(userID){
  var assignmentQuery = {search_term: CONFIG.canvas.assignments.webinarAttended},
  Eurl = 'https://crisistextline.instructure.com/api/v1/users/'+userID+'/enrollments';
      //scrape for user's enrollments in order to get course ID
  canvas.scrapeCanvasEnroll(Eurl)
  .then(function(enrollmentObj){
    if (!enrollmentObj.length) { 
      CONSOLE_WITH_TIME('This user has no enrollments');
      return;}
    if (enrollmentObj[0].type=='TeacherEnrollment' || enrollmentObj[0].type=='DesignerEnrollment'){
      CONSOLE_WITH_TIME('THE USER ' + enrollmentObj[0].user.name + ' APPEARS TO BE A TEACHER, ABORTING GRADING');
      return;
    }
    var courseID = enrollmentObj[0].course_id;
    //scrape for the id of the relevant assignment within a specific course
    canvas.scrapeCanvasA(courseID, assignmentQuery)
    .then(function(assignment){
    //gives canvas user credit for attending a GTW observation
    markAttendanceInCanvas(courseID, assignment[0].id, userID);
    });
  });
}

//gives credit for attending a GTW webinar on Canvas to a user
function markAttendanceInCanvas(courseID, assignmentID, userID){
 canvas.updateGradeCanvas(courseID, assignmentID, userID, 'pass');
}

//HELPERS

//emails Heather whenever a user uses different emails on Canvas and GTW and we can't find them to give them credit
function emailTrainer(user, option){
  var template,
  content;

  if (option===0){
    template = fs.readFileSync('./email_templates/canvas_email_not_found.txt', {encoding: 'utf-8'});
    content = template.replace('%fname', user.firstName).replace('%lname', user.lastName).replace('%email', user.email);
  } else if (option==1) {
    template = fs.readFileSync('./email_templates/canvas_dup_emails.txt', {encoding: 'utf-8'});
    content = template.replace('%email', user[0].email).replace('%user', user);
  } else if (option==2) {
    template = fs.readFileSync('./email_templates/canvas_email_and_name_not_found.txt', {encoding: 'utf-8'});
    content = template.replace('%fname', user.firstName).replace('%lname', user.lastName).replace('%email', user.email);
  } else {
    template = fs.readFileSync('./email_templates/canvas_dup_names.txt', {encoding: 'utf-8'});
    content = template.replace('%fname', user[0].firstName).replace('%lname', user[0].lastName).replace('%user', user);
  }

  var message = {
    subject: 'Cannot find GoToWebinar attendee on Canvas',
    text: content,
    from_email: 'support@crisistextline.org',
    from_name: 'Crisis Text Line',
    to: [{
        email: 'heather@crisistextline.org',
        name: 'Heather',
        type: 'to'
    }]
  };
  mandrill_client.messages.send({message: message, key: 'canvas_user_not_found'}, function (res) {
      CONSOLE_WITH_TIME(res);
  });
}

//makes time objects url friendly; replaces ':' w '%3A' 
//and returns GTW query time range
//ex: 2016-06-13T20:05:27Z to 2016-06-13T20%3A05%3A27Z
//the interval is 72 hours to ensure redundancy
function urlTime(){
  var endDate = new Date();
  var hours = endDate.getHours();
  var startDate = new Date();
  startDate.setHours(hours-CONFIG.GTW_time_range_query);
  endDate = endDate.toJSON().toString().slice(0,19)+'Z';
  startDate = startDate.toJSON().toString().slice(0,19)+'Z';
  var re = new RegExp(':', 'ig');
  return {endDate: endDate.replace(re, '%3A'), startDate: startDate.replace(re, '%3A')};
}

module.exports = {urlTime: urlTime, 
  emailTrainer: emailTrainer, 
  processor:checkForDupUsersInGTWFilterForThoseWhoAttendedLessThan90Mins};