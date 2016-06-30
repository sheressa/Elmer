var assert = require('assert');
var notifyMoreShiftsObj = require('../jobs/scheduling/NotifyMoreShifts.js');
var fs = require('fs');

describe('Notify More Shifts', function() {
  describe('finds users to notify and', function() {
    var twoShiftNotificationResult = notifyMoreShiftsObj.notifyMoreShifts();
    var usersToNotify = twoShiftNotificationResult.usersBeingNotified;
    var batchPosts = twoShiftNotificationResult.updateUserNotes;

    it('creates correct users object for users not yet notified', function (done) {

      assert(usersToNotify['5674723']);
      done();

    });

    it('creates correct post object for users not yet notified', function (done) {
    
      var expectedBatchPosts = [ { method: 'PUT', url: '/2/users/5674723', params: { notes: '{"two_shift_notification":true}' } } ];
      assert.deepEqual(batchPosts, expectedBatchPosts);
      done();

    });
  });
  it('creates correct mandrill messages', function (done){

    var sampleUser = {
      email: 'no@no.com',
      firstName: 'Someone',
      lastName: 'OrOther',
      shifts: [ 
        'Thu, 28 Jan 2016 14:00:00 -0500',
        'Mon, 01 Feb 2016 14:00:00 -0500' ]
    };
 
    var expectedToSection = [{
          email: sampleUser.email,
          name: sampleUser.firstName + ' ' + sampleUser.lastName,
          type: 'to'
      }];

    var expectedHTML = '<div><p> Hey Someone! </p><p> Woohoo! You signed up for 2 weekly shifts. We\'ve got you down for: </p><p>Thursday, January 28th 2016, 2:00 pm ET</p> <p>Monday, February 1st 2016, 2:00 pm ET</p><p> As promised, you\'ll be in good hands. Here are the supervisors who will have your back on your first shift: </p><div style=\'display: flex; text-align:center\'><div style="padding: 10px; border:1px solid black; width:160px; margin: 10px;">Lindsay Martin <br> <img src=https://s.gravatar.com/avatar/35a7cf2185f668864530cb0610b8372e?s=200 alt="Lindsay Martin" height="150" width="150"></div><div style="padding: 10px; border:1px solid black; width:160px; margin: 10px;">Garrett Shotwell <br> <img src=https://s.gravatar.com/avatar/d98b20d5c27e6ca6042440bf43dbd59b?s=200 alt="Garrett Shotwell" height="150" width="150"></div></div><p> Our supervisors are amazeballs. They\'re also human beings who take vacations and get sick - if your super above isn’t online for your shift, don\'t fret. You’ll be in good hands with someone else on our team. Here are a few pro tips for the platform: </p><ul><li>Your supervisor\'s name is on the upper left corner of your screen (click it and say hello!)</li><li>Enter your status under your name (suggestion: "First Shift" - or some funky version of this, so your fellow crisis counselors know to say hi!)</li><li>Only take 1 conversation at a time</li><li>NEVER feel like you are alone, your peers and supervisors are there to help!</li><li>Say hi to everyone in the Global Chat let them know you are new - join the convo (it\'s a fun crew!)</li><li>If you need to make any changes to your schedule, or aren\'t able to make your first shift please visit CTL Online and click on "Shift Scheduling".</li></ul> <p> Taking your first shift is the last step in becoming a bona fide Crisis Counselor! You got this!</p><p> Enjoy your first shift, </p> <p> The Crisis Text Line Training Team </p></div>';

    fs.readFile('./test/helpers/supervisorSampleData/sortedSupersToShifts.json', 'utf-8', function(err, shiftToSup) {
      if (err) console.log('FS ERROR', err);

      var createdMessage = notifyMoreShiftsObj.mandrillEachUser([sampleUser], JSON.parse(shiftToSup))[0];
      
      assert.equal(createdMessage.subject, 'Thank you for booking!');
      assert.equal(createdMessage.from_email, 'support@crisistextline.org');
      assert.equal(createdMessage.from_name, 'Crisis Text Line');
      assert.equal(createdMessage.headers['Reply-To'], 'support@crisistextline.org');
      assert.equal(createdMessage.html, expectedHTML);
      assert.deepEqual(createdMessage.to, expectedToSection);
      done();
    });
  });
});