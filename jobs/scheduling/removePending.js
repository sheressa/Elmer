'use strict';
/**
	Some churned users try to log back into WiW directly rather than CTL's single sign on. That bypasses all of our proper reactivation scripts and creates a new pending user object. We, however, prefer to reactivate deleted users rather than create redundant new profiles.

	This job gets a list of pending users and checks WiW's all deleted and active users for matches. If a pending user matches a deleted user, we reactivate the deleted user and reject the pending user. If a pending user matches an active user, we delete the pending user.
**/
global.KEYS = require('../../keys.js')
global.CONFIG = require('../../config.js');

const api = CONFIG.WhenIWork;
const CronJob = require('cron').CronJob;
// const cache =  require('../../cache.js');
// new CronJob(CONFIG.time_interval.pending_users, go, null, true);
// go(); //commented out for now
// get this party started
// function go(){
	// getPendingUsers();
// 	.then(getDeletedUsers)
// 	.then(reactivate)
// 	.catch(function(res){
// 		CONSOLE_WITH_TIME(`WiW Pending Users Reativation Failed, Error ${res}`);
// 	});
// }

return getPendingUsers();

// get WiW approval pending users
function getPendingUsers(){
	console.log('PENDING', global.CACHE.tester)
	// return new Promise(function(resolve, reject){
	// 	cache.WiWUsersCache()
	// 	.then(function(response){
	// 		console.log('response in remove', response.tester);
	// 		resolve(response);
	// 	})
	// })
	// return new Promise(function(resolve, reject){
	// 	api.get('users', function(res){
	// 		if (res.message) reject(`Call to get WiW pending users failed: ${res.message}`);
	// 		const pending = {};
	// 		res.users.forEach(function(user){
	// 			if(!user.is_active) pending[user.email] = user;
	// 		});
	// 		resolve(pending);
	// 	});
	// });
}

function getDeletedUsers(pending){
	// return new Promise(function(resolve, reject){
	// 	api.get('users', {show_deleted: true}, function(res){
	// 		if (res.message) reject(`Call to get WiW deleted users failed: ${res.message}`);
	// 		var reactivate = [];
	// 		res.users.forEach(function(user){
	// 			if (!user.is_deleted && pending[user.email]) {
	// 				// reject the pending user
	// 				rejectUser(pending[user.email]);
	// 			}
	// 			if(user.is_deleted && pending[user.email]) {
	// 				// add user into the reactivation array
	// 				reactivate.push(user);
	// 				rejectUser(pending[user.email]);
	// 			} 
	// 		});
	// 		// if a pending user matches a user we have previously deleted, reactivate the deleted user and reject a pending user
	// 		resolve(reactivate);
	// 	});
	// });
}

// reactivating a deleted user rather than approving a redundant pending user
function reactivate(list){
  // return new Promise(function(resolve, reject){
  // 	list.forEach(function(user){
  // 		CONSOLE_WITH_TIME('Reactivating user', Object.keys(user)[0]);
	 //    api.update(`users/${user.id}`, {reactivate:true}, function(res){
	 //      if (res.message) reject(`Reactivation for user ${user.id} failed: ${res.message}`);
	 //      else resolve(res);
	 //    });
  // 	});
  // });
}

//reject a pending user because WiW creates an unnecessary user object with the same email that we already have in our list of deleted users
function rejectUser(user){
	// api.delete(`users/${user.id}`, {delete_shifts: true}, function(res){
	// 	CONSOLE_WITH_TIME(`Pending user w email ${user.email} and id ${user.id} rejected with success: ${res.success}`);
	// });
}