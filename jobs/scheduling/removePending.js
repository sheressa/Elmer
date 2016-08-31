'use strict';
/**
	Some churned users try to log bak into WiW directly rather than CTL's single sign on. That bypasses all of our proper reactivation scripts and creates a new pending user object. We, however, prefer to reactivate deleted users rather than create redundant new profiles.
**/
const api = CONFIG.WhenIWork;
const CronJob = require('cron').CronJob;

new CronJob(CONFIG.time_interval.pending_users, go, null, true);
go();
// get this party started
function go(){
	getPendingUsers()
	.then(getDeletedUsers)
	.then(reactivate)
	.catch(function(res){
		CONSOLE_WITH_TIME('WiW Pending Users Reativation Failed, Error', res);
	});
}

// get WiW approval pending users
function getPendingUsers(){
	return new Promise(function(resolve, reject){
		api.get('users', function(res){
			if (res.message) reject(`Call to get WiW pending users failed: ${res.message}`);
			var pending = {};
			res.users.forEach(function(user){
				if(!user.is_active) pending[user.email] = user;
			});
			resolve(pending);
		});
	});
}

function getDeletedUsers(pending){
	return new Promise(function(resolve, reject){
		api.get('users', {show_deleted: true}, function(res){
			if (res.message) reject(`Call to get WiW deleted users failed: ${res.message}`);
			var reactivate = [];
			// if a pending user matches a user we have previously deleted, reactivate the deleted user and reject a pending user
			res.users.forEach(function(user){
				if (!user.is_deleted && pending[user.email]) {
					// reject the pending user
					rejectUser(pending[user.email]);
				}
				if(user.is_deleted && pending[user.email]) {
					// add user into the reactivation array
					reactivate.push(user);
					rejectUser(pending[user.email]);
				} 
			});
			resolve(reactivate);
		});
	});
}

// reactivating a deleted user rather than approving a reduntant pending user
function reactivate(list){
	console.log('lenght', list.length, 'list', list);

  return new Promise(function(resolve, reject){
  	list.forEach(function(user){
	    api.update(`users/${user.id}`, {reactivate:true}, function(res){
	      if (res.message) reject(`User reactivation failed: ${res.message}`);
	      else resolve(res);
	    });
  	});
  });
}

//reject a pending user because WiW creates an unnecessary user object with the same email that we already have in our list of deleted users
function rejectUser(user){
	api.delete(`users/${user.id}`, {delete_shifts: true}, function(res){
		CONSOLE_WITH_TIME('Pending user', user, 'rejected:', res);
	});
}