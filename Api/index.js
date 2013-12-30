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
  var parts = url.split('/');
  // Remove extra path parts.
  parts.splice(-extra, extra);
  return request.protocol + '://' + request.headers.host + parts.join('/');
}

// __Module Definition__
var Api = module.exports = function Api (options) {
  options = connect.utils.merge({
    releases: [ '0.0.1' ]
  }, options);

  if (!options.releases.every(function (release) { return semver.valid(release) })) throw new Error('Invalid semver API release version.');

  var api = express();

  // TODO something like api.use(Version.buildFrom(controllersFor)); ???

  // Sort from highest to lowest release.
  var sortedReleases = options.releases.sort(semver.rcompare);

  // Set options on the api.
  Object.keys(options).forEach(function (key) {
    api.set(key, options[key]);
  });

  // Ensure all controllers satisfy some dependency.
  Object.keys(controllersFor).forEach(function (dependency) {
    var controllers = controllersFor[dependency];
    controllers.forEach(checkVersionConflict.bind(undefined, sortedReleases));
  });

  // Build the version controller for each release.
  sortedReleases.forEach(function (release) {
    api.use(Version());
  });

  return api;
};

// __Public Methods__
Api.rest = function (options) {
  var controller = Controller(options);
  // Don't publish it automatically if it's private.
  if (options.publish === false) return controller;
  return register(controller);
};

util.inherits(Api, express);

