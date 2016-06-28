var sampleData = require('../sampleData');

var WhenIWork = {
  get: function(term, params, cbFunction){
    //Below line is in case there are no params and a callback
    //is the second argument. May need to change this
    //in the future depending on what gets passed to 'get'.
    cbFunction = [].slice.call(arguments).pop();  
    if (term === 'users') {
      cbFunction(sampleData.usersResponse);
    }
    else if (term === 'users/7889841') {
      params({user: sampleData.usersResponse.users[2]});
    }
    else if (term === 'shifts') {
      cbFunction(sampleData.shiftsResponse);
    }
    else if (term === 'user') {
      cbFunction(sampleData.user);
    }
  },
  //POST AND UPDATE ARE JUST EMPTY FUNCTIONS, SINCE WE'RE NOT USING THE RESPONSES.
  post: function(term, params, cbFunction) {
    //may need to account for different arguments passed in in future
    if (term === 'users/profile') return {user: 'testUser'};
    if (cbFunction && typeof cbFunction === 'function') cbFunction();
    else if (cbFunction && typeof cbFunction !== 'function') {
      CONSOLE.WITH_TIME("Error! This callback function is not a function: ", cbFunction);
    }
  },
  update: function(term, params, cbFunction) {
    //may need to account for different arguments passed in in future.
    if (cbFunction && typeof cbFunction === 'function') cbFunction();
    else if (cbFunction && typeof cbFunction !== 'function') {
      CONSOLE.WITH_TIME("Error! This callback function is not a function: ", cbFunction);
    }
  },
  delete: function(term, params, cbFunction) {
    //may need to account for different arguments passed in in future.
    if (cbFunction && typeof cbFunction === 'function') cbFunction();
    else if (cbFunction && typeof cbFunction !== 'function') {
      CONSOLE.WITH_TIME("Error! This callback function is not a function: ", cbFunction);
    }
  },
};

module.exports = WhenIWork;