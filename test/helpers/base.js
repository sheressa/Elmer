var sampleData = require('../sampleData');

var WhenIWork = {
  get: function(term, params, cbFunction){
    if (typeof params === 'function') {
      cbFunction = params;
    }
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
    if (!cbFunction) {
      cbFunction = function() {};
    }
    cbFunction();
  },
  update: function(term, params, cbFunction) {
    if (!cbFunction) {
      cbFunction = function() {};
    }
    cbFunction();  
  }
};

module.exports = WhenIWork;