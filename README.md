# Elmer
Elmer, like da glue, holds everything together. Currently, it extends the functionality of our scheduling app [WhenIWork](http://wheniwork.com/) by supporting our custom use cases. Quite generally--among other functionality--it supports:

1. single sign-on through online.crisistextline.org
2. sending custom emails to users when they've successfully scheduled shifts
3. recurring shifts weekly
4. coloring shifts
5. deleting shifts

## Running on local
Run `npm install`. In your main directory, `touch config.js`. Copy-and-paste the contents of `config.js.default` into this new config file. Add requisite API keys.

Check out `package.json`. Note that `npm start` runs the app when in production, which really runs two separate processes:

1. runs scheduling cronjobs
2. runs Express routes which handle shift scheduling, deletion, single-sign-on / user creation, and timezone validation.

We split out these functions into two separate processes for more stability--if an API call returns that throws an exception, only one process will restart with `[forever](https://github.com/foreverjs/forever)`.

During development, we generally run each process separately, either running `node ./www/app.js` or `node ./runJobs.js`. Note that if no `NODE_ENV` specified, the environment is running in `develop` by default.

## Running on production

There's a Jenkins continuous integration job set up that allows for instant deploys from the master branch of this repo.

The Jenkins job runs the following:

`NODE_ENV=production PORT=80 forever npm start`

## Style
This repo will abide by [AirBnB's Ecmascript 5 standards](https://github.com/airbnb/javascript/tree/master/es5).
