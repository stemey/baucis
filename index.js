// __Dependencies__
var url = require('url');
var express = require('express');
var connect = require('connect');
var mongoose = require('mongoose');
var semver = require('semver');
var Controller = require('./Controller');

// __Private Module Members__

// Store controllers, keyed on API semver dependency the controllers satisfy.
var controllersFor = {};

function getMatchingReleases (releases, dependency) {
  var matching = releases.filter(function (release) {
    return semver.satisfies(release, dependency);
  });

  return matching;
}

function checkVersionConflict (releases, controller) {
  var controllerDependency = controller.get('dependency');

  var matchingReleases = getMatchingReleases(releases, controllerDependency);
  if (matchingReleases.length === 0) throw new Error("The controller dependency \"" + controllerDependency + "\" doesn't satisfy any API release.");

  // Find overlapping ranges.  A range overlaps if it shares any API release
  // versions with another range.
  var overlapping = Object.keys(controllersFor).filter(function (dependency) {
    var otherMatching = getMatchingReleases(releases, dependency);
    return matchingReleases.some(function (release) {
      return otherMatching.indexOf(release) !== -1;
    });
  });
  // Check that the controller does not already exist in any matching ranges.
  var ok = overlapping.every(function (dependency) {
    return controllersFor[dependency].every(function (otherController) {
      if (controller === otherController) return true;
      if (controller.get('plural') === otherController.get('plural')) throw new Error('Controller "' + controller.get('plural') + '" exists more than once in a release.');
      return controller.get('plural') !== otherController.get('plural');
    });
  });

  return !ok;
}

function register (controller) {
  // The controller's semver range
  var dependency = controller.get('dependency');
  if (!semver.validRange(dependency)) throw new Error('Controller dependency was not a valid semver range.');
  // Create an array for this range if it hasn't been registered yet.
  if (!controllersFor[dependency]) controllersFor[dependency] = [];
  // Add the controller to the controllers to be published.
  controllersFor[dependency].push(controller);
  return controller;
}

// Figure out the basePath for Swagger API definition
function getBase (request, extra) {
  var url = request.originalUrl;
  var split = url.split('/');
  split.splice(-extra, extra);
  return request.protocol + '://' + request.headers.host + split.join('/');
}

// A method for generating a Swagger resource listing
function generateResourceListing (options) {
  var plurals = options.controllers.map(function (controller) {
    return controller.get('plural');
  });
  var listing = {
    apiVersion: options.version,
    swaggerVersion: '1.1',
    basePath: options.basePath,
    apis: plurals.map(function (plural) {
      return { path: '/api-docs/' + plural, description: 'Operations about ' + plural + '.' };
    })
  };

  return listing;
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
    var version = express();
    var controllersInRelease = [];

    // Find all controllers in this release version.
    Object.keys(controllersFor).forEach(function (dependency) {
      if (!semver.satisfies(release, dependency)) return;
      controllersInRelease = controllersInRelease.concat(controllersFor[dependency]);
    });

    if (controllersInRelease.length === 0) throw new Error('There are no controllers in release "' + release + '".');

    // TODO move these middleware to mixins?

    // Activate Swagger resource listing.
    version.get('/api-docs', function (request, response, next) {
      if (app.get('swagger') !== true) return next();

      response.set('X-Powered-By', 'Baucis');
      response.json(generateResourceListing({
        version: release,
        controllers: controllersInRelease,
        basePath: getBase(request, 1)
      }));
    });

    // Mount all published controllers for this version.
    controllersInRelease.forEach(function (controller) {
      var route = url.resolve('/', controller.get('plural'));

      // Add a route for the controller's Swagger API definition
      version.get('/api-docs' + route, function (request, response, next) {
        if (app.get('swagger') !== true) return next();

        response.set('X-Powered-By', 'Baucis');
        response.json({
          apiVersion: release,
          swaggerVersion: '1.1',
          basePath: getBase(request, 2),
          resourcePath: route,
          apis: controller.swagger.apis,
          models: controller.swagger.models
        });
      });

      // Initialize and mount the controller to the version controller.
      controller.initialize();
      version.use(route, controller);
    });

    app.use(function (request, response, next) {
      // Check the request's version dependency.
      var range = request.headers['api-version'] || '*';
      // Check if this controller satisfies the dependency
      var satisfied = semver.satisfies(release, range);
      // Short-circuit this release if the version doesn't satisfy the dependency.
      if (!satisfied) return next();
      // Otherwise, let the request fall through to this version's middleware.
      response.set('API-Version', release);
      response.set('Vary', 'API-Version')
      return version(request, response, next);
    });
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
