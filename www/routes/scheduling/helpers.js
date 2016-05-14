// Helper functions for scheduling. Namely, used to manipulate shift objects.
var sha1 = require('sha1');

/**
    Returns true if the provided email, once hashed with the secret, matches the hash.
**/
function validate(email, hash) {
    var check = email + global.config.secret_key;
    return sha1(check) == hash;
}

/**
    Returns true if two shifts are duplicate, false if otherwise.
    Our working definition of duplicate? If two shifts were created
    from the same parent shift, and thus have the same parent_shift ID
    in its notes section.
**/
function areShiftsDuplicate(shiftA, shiftB) {
    var shiftsAreDuplicate = false;
    try {
        shiftsAreDuplicate = JSON.parse(shiftA.notes).parent_shift === JSON.parse(shiftB.notes).parent_shift;
    }
    catch (err) {
        console.log('JSON.parse failed to parse ' + shiftA + ' or ' + shiftB);
    }
    return shiftsAreDuplicate;
}

/**
    Returns 1 if firstMomentObject occurs after secondMomentObject in the
    weekly calendar, returns -1 if firstMomentObject occurs before
    secondMomentObject.
**/
function sortByDayAscAndTimeAsc(firstMomentObject, secondMomentObject) {
    if (firstMomentObject.day() !== secondMomentObject.day()) {
        return firstMomentObject.day() > secondMomentObject.day() ? 1 : -1;
    }
    else if (firstMomentObject.hours() !== secondMomentObject.hours()) {
        return firstMomentObject.hours() > secondMomentObject.hours() ? 1 : -1;
    }
    else if (firstMomentObject.minutes() !== secondMomentObject.minutes()) {
        return firstMomentObject.minutes() > secondMomentObject.minutes() ? 1 : -1;
    }
    else if (firstMomentObject.seconds() !== secondMomentObject.seconds()) {
        return firstMomentObject.seconds() > secondMomentObject.seconds() ? 1 : -1;
    }
    return 0;
}

/**
    Returns 1 if firstMomentObject occurs after secondMomentObject,
    returns -1 if firstMomentObject occurs before secondMomentObject.
**/
function dateSort(firstMomentObject, secondMomentObject) {
    return (firstMomentObject > secondMomentObject ? 1 : -1);
}

module.exports = {
    validate: validate,
    areShiftsDuplicate: areShiftsDuplicate,
    sortByDayAscAndTimeAsc: sortByDayAscAndTimeAsc,
    dateSort: dateSort
}
