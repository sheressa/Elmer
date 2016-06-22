//global variables are here to run this file separately in node
global.CONFIG = require('../../config.js');
global.KEYS = require('../../keys.js');

var CronJob = require('cron').CronJob;
var canvas = require('../../canvas.js');
var bignumJSON = require('json-bignum');
var Request = require('request');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);


//runs crone job every day
//not ready to be commented out
// new CronJob(CONFIG.gtw_attendance_sync_with_canvas, function () {
//    scrapeGTWSessions();
// }, null, true);


scrapeGTWSessions();

//gets all webinar sessions in a specified time period
function scrapeGTWSessions(){
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

	function callback(e, r, b) {
  		if (!e && r.statusCode == 200) {
	   		var info = bignumJSON.parse(b);
        if(info.length===0){
          CONSOLE_WITH_TIME('NO SESSIONS DURING', startTime, 'and', endTime, '!');
          return;
        }
	   		info.forEach(function(webinar){
	   			keysArr.push({webinarKey: webinar.webinarKey.toString(), sessionKey: webinar.sessionKey.toString()});
	   		});
	   		scrapeGTWAttendees(keysArr);
  		} else {
  			CONSOLE_WITH_TIME("GTW get all webinars error message: ", b);
  		}
	}

	Request.get(options, callback);
}

//gets all webinar attendees for each session
function scrapeGTWAttendees(keysArr){

	function callback(e, r, b) {
  		if (!e && r.statusCode == 200) {
	   		var info = bignumJSON.parse(b);
	   		checkForDupUsersInGTWFilterForThoseWhoAttendedLessThan90Mins(info);
  		} else {
  			CONSOLE_WITH_TIME("GTW get all webinar attendees error message: ", b);
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
	var last;
  var GTWusers = [];

	arr.forEach(function(user, index){
		if(!last){
		last = {firstName: user.firstName, lastName: user.lastName, email: user.email, attendance: user.attendanceTimeInSeconds};
		} else {
			if(last.email == user.email){
				last.attendance+=user.attendanceTimeInSeconds;
			} else {
				if(last.attendance>=CONFIG.GTW_attendance_minimum) {GTWusers.push(last);}
				last = {firstName: user.firstName, lastName: user.lastName, email: user.email, attendance: user.attendanceTimeInSeconds};
			}
			if(arr.length-1==index){
			 GTWusers.push(last);

			}
		}
	});
  //stops the script if GTWusers array is empty
  if(!GTWusers) { 
    CONSOLE_WITH_TIME('None of the scrapped GTW users attended a webinar for 90 minutes or more.');
     return;
   } else {
    scrapeCanvasUsers(GTWusers);
  }
}

//scrapes canvas for user, course and assignment id's
function scrapeCanvasUsers(GTWusers){
   var assignmentQuery = {search_term:'Attend 1 Observation'},
       Uurl = 'https://crisistextline.instructure.com/api/v1/accounts/1/users';
  
  GTWusers.forEach(function(guser){
    var emailQuery = {search_term: guser.email};
    //query canvas for a user using user email
    canvas.scrapeCanvasU(Uurl, emailQuery)
    .then(function(user){
      if (user.length===0) { 
        emailtrainer(guser);
        CONSOLE_WITH_TIME("COULD NOT FIND: ", guser);
        return;}

      if(user.length>1){
        // emailtrainer(guser);
        CONSOLE_WITH_TIME("TWO USERS WITH THE SAME EMAIL FOUND ", user);
        return;}

      var uID = user[0].id;
      var Eurl = 'https://crisistextline.instructure.com/api/v1/users/'+uID+'/enrollments';
      //scrape for user's enrollments in order to get course ID
      canvas.scrapeCanvasEnroll(Eurl)
      .then(function(eobj){
        if (eobj.length==0) { 
          CONSOLE_WITH_TIME('This user has no enrollments');
          return;}
        var cID = eobj[0].course_id;
        //scrape for the id of the relevant assignment within a specific course
        canvas.scrapeCanvasA(cID, assignmentQuery)
        .then(function(assignment){
          console.log('got to mark attendance ', cID, assignment[0].id, eobj[0].user_id);

        // DO NOT CALL THE FUNCTION BELOW AT THIS TIME; IT IS A FUNCTIONAL POST REQUEST
        //gives canvas user credit for attending a GTW observation
        // markAttendance(cID, assignment[0].id, uID);
        
        });
      });
    });
  });
}

//gives credit for attending a GTW webinar on Canvas to a user
//can't implement now because attending a session is a quiz now, not a binary pass/fail

// function markAttendance(cID, aID, uID){
//  canvas.updateGradeCanvas(cID, aID, uID, 'pass');
// }

//HELPERS

//emails Heather whenever a user uses different emails on Canvas and GTW and we can't find them to give them credit
function emailtrainer(user){
  var content = 'Hello Heather! GoToWebinar user '+user.firstName + ' ' + user.lastName +' email: '+ user.email + ' was not found on Canvas and we could not give them credit for attending a GoToWebinar observation.';

  var message = {
    subject: 'Cannot find GoToWebinar attendee on Canvas',
    text: content,
    from_email: 'support@crisistextline.org',
    from_name: 'Crisis Text Line',
    to: [{
        // email: 'heather@crisistextline.org',
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
  var h = endDate.getHours();
  var startDate = new Date();
  startDate.setHours(h-72);
  endDate = endDate.toJSON().toString().slice(0,19)+'Z';
  startDate = startDate.toJSON().toString().slice(0,19)+'Z';
  var re = new RegExp(':', 'ig');
  return {endDate: endDate.replace(re, '%3A'), startDate: startDate.replace(re, '%3A')};
}