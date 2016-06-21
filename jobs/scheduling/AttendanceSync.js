var CronJob = require('cron').CronJob;
var canvas = require('../../canvas.js');
var bignumJSON = require('json-bignum');
var Request = require('request');

//global variables are here to run this file separately in node
global.CONFIG = require('../../config.js')
global.KEYS = require('../../keys.js')
 
var GTWusers = [];

//run crone job every day, interval three days; for redundancy 
//not ready to be commented out
// new CronJob(CONFIG.time_interval.open_shifts, function () {
//    scrapeGTWSessions();
// }, null, true);


scrapeGTWSessions();

//gets all webinar sessions in a specified time period
function scrapeGTWSessions(){
  var keysArr = [];
  // var time = urlTime();
  // var endTime = time.endDate;
  // var startTime = time.startDate;

  //time function needs tweaking, use this for testing for now
  var endTime = '2016-06-21T20%3A05%3A27Z';
  var startTime = '2016-06-19T20%3A05%3A27Z';
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
    scrapeCanvasUsers();
  }
}

//scrapes canvas for user, course and assignment id's
function scrapeCanvasUsers(){
	var uID,
	cID,
	aID,
  Eurl,
	emailQuery = {search_term: null};
	assignmentQuery = {search_term:'Attend 1 Observation'};

	var Uurl = 'https://crisistextline.instructure.com/api/v1/accounts/1/users';

	GTWusers.forEach(function(guser){

		emailQuery.search_term = guser.email;
    //query canvas for a user using user email
		canvas.scrapeCanvasU(Uurl, emailQuery)
		.then(function(user){

			if (!user) { 
				//@ TODO: send request again using name only, if that fails 
				console.log("COULD NOT FIND: ", emailQuery.search_term)
				return;}

      //@TODO: V2: send an email to trainers if the below happens 

			if(user.length>1){
				//not going to happen w email (unless there are duplicate accounts), but can w name? but since we're querying by email first there is nothing we can do at this point
        // sendEmailtoTrainers();
				console.log('canvas users more THAN ONE');
				return;
			}
			uID = user[0].id;
			Eurl = 'https://crisistextline.instructure.com/api/v1/users/'+uID+'/enrollments';
      //scrape for user's enrollments in order to get course ID
			canvas.scrapeCanvasEnroll(Eurl)
			.then(function(eobj){
				if (eobj.length==0) { 
          CONSOLE_WITH_TIME('This user has no enrollments');
          return;
        }
				cID = eobj[0].course_id;
        //scrape for the id of the relevant assignment within a specific course
				canvas.scrapeCanvasA(cID, assignmentQuery)
				.then(function(assignment){
					console.log('got to mark attendance ', cID,assignment[0].id, uID);

        // DO NOT CALL THE FUNCTION BELOW AT THIS TIME; IT IS A FUNCTIONAL POST REQUEST
        //gives canvas user credit for attending a GTW observation
				// markAttendance(cID, assignment[0].id, uID);
				
				});
			});
		});
	})
}

//gives credit for attending a GTW webinar on Canvas to a user
//can't implement now because attending a session is a quiz now, not a binary pass/fail

// function markAttendance(cID, aID, uID){
//  canvas.updateGradeCanvas(cID, aID, uID, 'pass');
// }

//HELPERS

function sendEmailtoTrainers(user){}

//makes time objects url friendly; replaces ':' w '%3A' 
//and returns GTW query time range
//ex: 2016-06-13T20:05:27Z to 2016-06-13T20%3A05%3A27Z
//npm moment can make this a tiny bit better
function urlTime(){
	var endDate = new Date();
	var m = endDate.getMinutes();
	var startDate = (new Date());
  //right now this has a 5 minute interval which i will change to 1 day
	startDate.setMinutes(m-5);
	endDate = endDate.toJSON().toString().slice(0,19)+'Z';
	startDate = startDate.toJSON().toString().slice(0,19)+'Z';
	var re = new RegExp(':', 'ig');
	return {endDate: endDate.replace(re, '%3A'), startDate: startDate.replace(re, '%3A')};
}