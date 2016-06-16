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
    if (cbFunction && typeof cbFunction === 'function') cbFunction();
  },
  update: function(term, params, cbFunction) {
    //may need to account for different arguments passed in in future.
    if (cbFunction && typeof cbFunction === 'function') cbFunction();
  }
};

module.exports = WhenIWork;