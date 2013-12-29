// __Dependencies__
var url = require('url');
var express = require('express');
var connect = require('connect');
var mongoose = require('mongoose');
var semver = require('semver');
var Controller = require('../Controller');
var Version = require('../Version');

// __Private Module Members__

// Store controllers, keyed on API semver dependency the controllers satisfy.
var controllersFor = {};

// Figure out the basePath for Swagger API definition
function getBase (request, extra) {
  var url = request.originalUrl;
  var split = url.split('/');
  split.splice(-extra, extra);
  return request.protocol + '://' + request.headers.host + split.join('/');
}

function empty () {
  controllersFor = {};
}

// __Module Definition__
var baucis = module.exports = function (options) {
  options = connect.utils.merge({
    releases: [ '0.0.1' ]
  }, options);

  if (!options.releases.every(function (release) { return semver.valid(release) })) throw new Error('Invalid semver API release version.');

  var app = express();

  // TODO something like app.use(Version.buildFrom(controllersFor)); ???

  // Sort from highest to lowest release.
  var sortedReleases = options.releases.sort(semver.rcompare);

  // Set options on the app.
  Object.keys(options).forEach(function (key) {
    app.set(key, options[key]);
  });

  // Ensure all controllers satisfy some dependency.
  Object.keys(controllersFor).forEach(function (dependency) {
    var controllers = controllersFor[dependency];
    controllers.forEach(checkVersionConflict.bind(undefined, sortedReleases));
  });

  // Build the version controller for each release.
  sortedReleases.forEach(function (release) {
    app.use(Version());
  });

  // Empty the controllers store to prepare for creating more APIs
  empty();

  return app;
};

// __Public Methods__
baucis.rest = function (options) {
  var controller = Controller(options);
  // Don't publish it automatically if it's private.
  if (options.publish === false) return controller;
  return register(controller);
};

baucis.empty = empty.bind(baucis);
