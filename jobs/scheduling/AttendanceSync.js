var CronJob = require('cron').CronJob;
var canvas = require('../../canvas.js');
var bignumJSON = require('json-bignum');
var Request = require('request');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);

//runs crone job every day at 5am
new CronJob(CONFIG.time_interval.gtw_attendance_sync_with_canvas, function () {
   scrapeGTWSessions();
}, null, true);

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
        //we need bignumJSON because JS rounds GTW session ids otherwise
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
        emailtrainer(guser, 0);
        scrapeCanvasNames([guser]);
        CONSOLE_WITH_TIME("COULD NOT FIND USER BY EMAIL: ", guser);
        return;}

      if(user.length>1){
        emailtrainer(guser, 1);
        scrapeCanvasNames(user);
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
        //gives canvas user credit for attending a GTW observation
        markAttendance(cID, assignment[0].id, uID);
        
        });
      });
    });
  });
}


function scrapeCanvasNames(gtwUser){
   var assignmentQuery = {search_term:'Attend 1 Observation'},
       Uurl = 'https://crisistextline.instructure.com/api/v1/accounts/1/users';
  
  gtwUser.forEach(function(guser){
    var nameQuery = {search_term: guser.firstName+' '+guser.lastName};
    //query canvas for a user using user name
    canvas.scrapeCanvasU(Uurl, nameQuery)
    .then(function(user){
      if (user.length===0) { 
        emailtrainer(guser, 2);
        CONSOLE_WITH_TIME("COULD NOT FIND USER BY NAME: ", guser);
        return;}

      if(user.length>1){
        emailtrainer(guser, 3);
        CONSOLE_WITH_TIME("TWO USERS WITH THE SAME NAME FOUND ", user);
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
        //gives canvas user credit for attending a GTW observation
        markAttendance(cID, assignment[0].id, uID);
        
        });
      });
    });
  });
}

//gives credit for attending a GTW webinar on Canvas to a user
//can't implement now because attending a session is a quiz now, not a binary pass/fail

function markAttendance(cID, aID, uID){
 canvas.updateGradeCanvas(cID, aID, uID, 'pass');
}


//HELPERS

//emails Heather whenever a user uses different emails on Canvas and GTW and we can't find them to give them credit
function emailtrainer(user, option){
  var message = {
    subject: 'Cannot find GoToWebinar attendee on Canvas',
    text: '',
    from_email: 'support@crisistextline.org',
    from_name: 'Crisis Text Line',
    to: [{
        email: 'heather@crisistextline.org',
        name: 'Heather',
        type: 'to'
    }]
  };
  var a = {body: 'Hello Heather! GoToWebinar user '+user.firstName + ' ' + user.lastName +' email: '+ user.email + ' was not found on Canvas by email and we could not give them credit for attending a GoToWebinar observation at this time. We will attempt to find them by name next. '},
  c = {body:'Hello Heather! GoToWebinar user '+user.firstName + ' ' + user.lastName +' email: '+ user.email + ' was not found on Canvas by email or by name and we could not give them credit for attending a GoToWebinar observation.'};

  switch(option) {
    case 0:
    message.text = a.body;
    case 2:
    message.text = c.body;
  }

  if(user.length>1){
  var d = {body:'Hello Heather! GoToWebinar user '+user[0].firstName + ' ' + user[0].lastName + ' was not found on Canvas by an initial email search and has returned two or more users after a secondary name search. We therefore could not give them credit for attending a GoToWebinar observation. The returned user objects are: '+user},
    b = {body:'Hello Heather! GoToWebinar user with email: '+ user[0].email + ' matched two or more accounts on Canvas and therefore we could not give them credit for attending a GoToWebinar observation. The returned duplicate user objects are: '+user};

  switch(option) {
    case 1:
    message.text = b.body;
    case 3:
    message.text = d.body;
    }
  }

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