'use strict';

const fs = require('fs');
const sha1 = require('sha1');

function fromCSV(infile, outfile) {
  var out = '';
  infile = getFullPath(infile);
  outfile = getFullPath(outfile);

  var intext = fs.readFileSync(infile, 'ascii').split("\n");
  for (var i in intext) {
    out += intext[i] + ',' + generate(intext[i]) + "\n";
  }

  fs.writeFileSync(outfile, out);
}

function generate(email) {
  var out = hash(email);
  CONSOLE_WITH_TIME(out);
  return out;
}

function getFullPath(filename) {
  if (filename[0] == '/') {
    return filename;
  } else {
    return process.cwd() + '/' + filename;
  }
}

function hash(email) {
  return sha1(email + KEYS.secret_key);
}

module.exports = {
  fromCSV: fromCSV,
  generate: generate
};
