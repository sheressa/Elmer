'use strict';

const readline = require('readline');
const google = require('googleapis');
const GoogleAuth = require('google-auth-library');
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

/*
 * @param {String} sheetId The id of the G sheet (last part of URL).
 * @param {String} sheetName The name of the specific sheet to access.
 * @param {String} cellRange The range of cells to retrieve from that sheet.
*/ 
function getGsheetRange(sheetId, sheetName, cellRange) {
  const range = `${sheetName}!${cellRange}`;
  const specificRequest = createRequestPromise(sheetId, range);
// Authorize a client with the loaded credentials, then call the Google Sheets API.
  return authorize(KEYS.gSheets, specificRequest);
}

/**
 * Create an OAuth2 client with the given credentials, and return a Promise
 * for the response.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {Promise} promise The promise to create with the authorized client.
 */
function authorize(credentials, promise) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new GoogleAuth();
  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  if (KEYS.gSheets.token) {
    oauth2Client.credentials = KEYS.gSheets.token;
    return promise(oauth2Client);
  } else {
    return getNewToken(oauth2Client, promise);
  }
}

/**
 * Create a request for the specific sheet and cell range
 */
function createRequestPromise (spreadsheetId, range) {
  return function (auth) {
    return new Promise(function(resolve, reject) {
      const sheets = google.sheets('v4');
      sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId,
        range,
      }, function(err, response) {
        if (err) {
          reject('The API returned an error: ' + err);
        }
        if (response.values.length === 0) {
          reject('No data found.');
        } else {
          resolve(response);
        }
      });
    });
  };
}

/**
 * Get and store new token after prompting for user authorization, and then
 * return a Promise for the response.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsPromise} promise The promise to create with the authorized client.
 */
function getNewToken(oauth2Client, promise) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      return promise(oauth2Client);
    });
  });
}

/**
 * I'm console logging the token and copying it into KEYS.
 * This should store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  console.log('Token for use ' + JSON.stringify(token));
  KEYS.gSheets.token = token;
}

module.exports = {getGsheetRange};