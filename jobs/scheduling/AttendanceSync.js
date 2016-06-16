var CronJob = require('cron').CronJob;
var Request = require('request');
var bignumJSON = require('json-bignum');
var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var canvas = require('../../canvas.js');
var promise = require('bluebird');
global.CONFIG = require('../../config.js')
global.KEYS = require('../../keys.js')

//TEST IN TEST LOCATIONS TEST IN TEST LOCATIONS TEST IN TEST LOCATIONS TEST IN TEST LOCATIONS TEST IN TEST LOCATIONS TEST IN TEST LOCATIONS TEST IN TEST LOCATIONS TEST IN TEST LOCATIONS 
console.log('canvas ', canvas)
var GTWusers = [];
var emailHash = {};
var nameHash = {};

// new CronJob(CONFIG.time_interval.open_shifts, function () {
//     scrape();
// }, null, true);


// NOTES NOTES NOTES NOTES NOTES

//fix CroneJob (config file times)

scraperGTWSess();

//get all webinar sessions
function scraperGTWSess(){
	var keysArr = [];
	// var time = urlTime();
	// var endTime = time.endDate;
	// var startTime = time.startDate;

	var endTime = '2016-05-09T20%3A05%3A27Z';
	var startTime = '2016-05-01T20%3A05%3A27Z';
	// console.log('time time time time ', time)

	var url = 'https://api.citrixonline.com/G2W/rest/organizers/'+KEYS.GTW.org_id+'/sessions?fromTime='+startTime+'&toTime='+endTime;
	var options = {
  		url: url,
  		headers: {
  		Accept: 'application/json',
    	Authorization: KEYS.GTW.api_key
  		}
	};

	console.log('url ', url)

	function callback(e, r, b) {
  		if (!e && r.statusCode == 200) {
	   		var info = bignumJSON.parse(b);
	   		// console.log('info info info ', info, b)
	   		info.forEach(function(webinar){
	   			// console.log('webinar webinar webinar ', webinar)
	   			keysArr.push({webinarKey: webinar.webinarKey.toString(), sessionKey: webinar.sessionKey.toString()});
	   		});
	   		scrapeGTWAttendees(keysArr);
  		} else {
  			CONSOLE_WITH_TIME("GTW get all webinars error message: ", b);
  		}
	}

	Request.get(options, callback);
}

//get all webinar attendees
function scrapeGTWAttendees(keysArr){

	function callback(e, r, b) {
  		if (!e && r.statusCode == 200) {
	   		var info = bignumJSON.parse(b);
	   		// console.log('GTW USERS ', info)
	   		processor(info);
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
function processor(arr){
	var last;

	arr.forEach(function(user, index){
		if(!last){
		last = {firstName: user.firstName, lastName: user.lastName, email: user.email, attendance: user.attendanceTimeInSeconds};
		} else {
			if(last.email == user.email){
				last.attendance+=user.attendanceTimeInSeconds;
			} else {
				if(last.attendance>=5400) {GTWusers.push(last);}
				last = {firstName: user.firstName, lastName: user.lastName, email: user.email, attendance: user.attendanceTimeInSeconds};
			}
			if(arr.length-1==index){
				// console.log('gtw users from processor ', GTWusers)
			 GTWusers.push(last)
			 hash(GTWusers);
			}
		}
	});
	canvasUsers();
}

//return the id of the webinar assignment for a specific course
function observationID(assignments){
	assignments.forEach(function(assignment){
		if(assignment.name.slice(0,36)=="Checkpoint #12: Attend 1 Observation") return assignment.id;
	})
};

function canvasUsers(){
	var aID,
	cID;

	return canvas.scrapeCanvasC()
	.then(function(courses){
		courses.forEach(function(course){
			if(course.id<42) return;
			cID=course.id;
			promise.all([canvas.scrapeCanvasA(course.id), canvas.scrapeCanvasU(course.id)])
			.then(function(answers){
				console.log('answers ', answers.length)
				aID = observationID(answers[0]);
				if (answers[1]) checkForAttendance(answers[1], aID, cID);
			})
		})
	})


	// canvas.scrapeCanvasC()
	// .then(function(courses){
	// 	courses.forEach(function(course){
	// 		if(course.id<42) return;
			
	// 		canvas.scrapeCanvasA(course.id)
	// 		.then(function(assignments){
	// 			if(assignment.name.slice(0,36)!="Checkpoint #12: Attend 1 Observation") return;
	// 			scrapeCanvasU(course.id, assignment.id)
	// 			.then(function(users){
	// 				hash(users, function(){
	// 					checkForAttendance();
	// 				});
	// 			})
	// 		})
	// 	})
	// })

	// canvas.scrapeCanvasC(function(courses){
	// 	courses.forEach(function(course){
	// 		if(course.id<42) return;
	// 		canvas.scrapeCanvasA(course.id, function(assignments){
	// 			assignments.forEach(function(assignment){
	// 			if(assignment.name.slice(0,36)!="Checkpoint #12: Attend 1 Observation") return;
	// 			scrapeCanvasU(course.id, assignment.id, function(users){
	// 				hash(users, function(){
	// 					checkForAttendance();
	// 				});
	// 			});
	// 		});
	// 		});
	// 	});		
	// });
}

//hash GTW instead of canvas users
//finds id's of canvas users who have attended the gtw webinar
function checkForAttendance(users, aID, cID){
 	// console.log('email hash ', emailHash, 'nameHash ', nameHash);
 users.forEach(function(user){
 	// var name = user.firstName + " "+ user.lastName;
 	// console.log('we made it, mom ')
 	if(emailHash.hasOwnProperty(user.login_id)) {
 		// console.log('inside of email')
 		// console.log('from the email hash ', emailHash[user.login_id]);
 		// markAttendance(cID, aID, user.id);
 	} else if(nameHash.hasOwnProperty(user.name)){
 		// console.log('inside of name')
 		// console.log('from the name hash ', nameHash[name]);
 		// markAttendance(cID, aID, user.id)
 	} 
 	// else {
 	// 	CONSOLE_WITH_TIME('Sorry, ' + user.name +' is not in the Canvas database system.');
 	// }
 });
}

//gives credit for attending a GTW webinar on Canvas
// function markAttendance(cID, aID, uID){
// 	var url = 'https://crisistextline.instructure.com/api/v1/courses/'+cID+'/assignments/'+aID+'/submissions/'+uID;
// 	var options = {
// 		url: url,
// 		headers: {
// 			Authorization: KEYS.canvas.api_key
// 		}, 
// 		json: true,
// 		body: {submission:{posted_grade: "pass"}}
// 	};

// 	function callback(e, r, b){
// 		if(!e && r.statusCode == 200){
// 			console.log(b);
// 		} else {
// 			CONSOLE_WITH_TIME("Canvas post error message: ", b);
// 		}
// 	};

// 	Request.put(options, callback);
// }

//HELPERS

// hashes canvas users so we don't have to enter the exciting world of nested forloops in the checkForAttendance function
function hash(GTWUsers){
	GTWUsers.forEach(function(user, index){
		var name = user.firstName+" "+user.lastName;
		emailHash[user.email] = index;
		nameHash[name] = index;
	});
}

//makes time objects url friendly; replaces ':' w '%3A' 
//and returns GTW query time range
//ex: 2016-06-13T20:05:27Z to 2016-06-13T20%3A05%3A27Z
//npm moment can make this a tiny bit better
function urlTime(){
	var endDate = new Date();
	var m = endDate.getMinutes();
	var startDate = (new Date());
	startDate.setMinutes(m-5);
	endDate = endDate.toJSON().toString().slice(0,19)+'Z';
	startDate = startDate.toJSON().toString().slice(0,19)+'Z';
	var re = new RegExp(':', 'ig');
	return {endDate: endDate.replace(re, '%3A'), startDate: startDate.replace(re, '%3A')};
}