var fs = require('fs');

var WhenIWork = {
  get: function(term, params, cbFunction){
    //Below line is in case there are no params and a callback
    //is the second argument. May need to change this
    //in the future depending on what gets passed to 'get'.
    cbFunction = [].slice.call(arguments).pop();  
    readResponse (term, cbFunction);
  },
  //POST AND UPDATE ARE JUST EMPTY FUNCTIONS, SINCE WE'RE NOT USING THE RESPONSES.
  post: function(term, params, cbFunction) {
    //may need to account for different arguments passed in in future
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
};

function readResponse (term, cbFunction) {
  fs.readFile('./test/helpers/supervisorSampleData/response' + term + '.json', 'utf-8', function(err, data) {
    if (err) console.log('FS ERROR', err);
    cbFunction(data);
  });
}

module.exports = WhenIWork;