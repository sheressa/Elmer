var scheduleShiftsURL = '/scheduling/login?'
  ;

function renderShiftDeleteSuccess(req, res) {
  var deletedShiftInformation
    , regShifts = []
    , makShifts = []
    ;

  try {
    deletedShiftInformation = JSON.parse(req.query.deletedShiftInformation);
  }
  catch (e) {
    consoleWithTime('Unable to parse deleted shift information, error: ', e);
  }

  for (key in deletedShiftInformation.regShifts) {
    regShifts.push(deletedShiftInformation.regShifts[key]);
  }
  for (key in deletedShiftInformation.makShifts) {
    makShifts.push(deletedShiftInformation.makShifts[key]);
  }

  var templateData = {
    email: req.query.email,
    token: req.query.token,
    userName: req.query.userName,
    url: scheduleShiftsURL,
    regShifts: regShifts,
    makShifts: makShifts
  };

  res.render('scheduling/someShiftsCancelled', templateData);
}

module.exports = renderShiftDeleteSuccess;
