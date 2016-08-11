'use strict';

const originalSampleData = require('../../sample_data/sampleData');

function WhenIWork(key, email, password){
  return this;
} 

WhenIWork.prototype.get =  function(term, params, cbFunction){
  //this breaks the reference link, so that we don't cache sample data and instead get fresh data on every call
  const sampleData = JSON.parse(JSON.stringify(originalSampleData));
  //Below line is in case there are no params and a callback
  //is the second argument. May need to change this
  //in the future depending on what gets passed to 'get'.
  cbFunction = [].slice.call(arguments).pop();  
  if (term === 'users?include_objects=false') {
    cbFunction(sampleData.usersResponse);
  }
  else if (term === 'users') {
    cbFunction(sampleData.usersResponse);
  }
  else if (term === 'users/7889841') {
    params({user: sampleData.usersResponse.users[2]});
  }
  else if (term === 'shifts?include_objects=false') {
    cbFunction(sampleData.shiftsResponse);
  }
  else if (term === 'shifts') {
    cbFunction(sampleData.shiftsResponse);
  }
  else if (term === 'user') {
    cbFunction(sampleData.user);
  }
}
//POST AND UPDATE ARE JUST EMPTY FUNCTIONS, SINCE WE'RE NOT USING THE RESPONSES.
WhenIWork.prototype.post = function(term, params, cbFunction) {
  //this breaks the reference link, so that we don't cache sample data and instead get fresh data on every call
  const sampleData = JSON.parse(JSON.stringify(originalSampleData));
  //may need to account for different arguments passed in in future
  if (term === 'users/profile') {
    var test = {user: params.email};
    return cbFunction(test);
  }
  if (cbFunction && typeof cbFunction === 'function') {
    cbFunction();
  }
  else if (cbFunction && typeof cbFunction !== 'function') {
    CONSOLE.WITH_TIME("Error! This callback function is not a function: ", cbFunction);
  }
}
WhenIWork.prototype.update = function(term, params, cbFunction) {
  //may need to account for different arguments passed in in future.
  if (cbFunction && typeof cbFunction === 'function') cbFunction();
  else if (cbFunction && typeof cbFunction !== 'function') {
    CONSOLE.WITH_TIME("Error! This callback function is not a function: ", cbFunction);
  }
}
WhenIWork.prototype.delete = function(term, params, cbFunction) {
  //may need to account for different arguments passed in in future.
  if (cbFunction && typeof cbFunction === 'function') cbFunction();
  else if (cbFunction && typeof cbFunction !== 'function') {
    CONSOLE.WITH_TIME("Error! This callback function is not a function: ", cbFunction);
  }
}

var api = new WhenIWork(KEYS.test.wheniwork.api_key, KEYS.test.wheniwork.username, KEYS.test.wheniwork.password)

module.exports = api;