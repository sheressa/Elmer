var sampleData = require('../sampleData');

var WhenIWork = {
  get: function(term, params, cbFunction){
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
  post: function() {},
  update: function() {}
};

module.exports = WhenIWork;