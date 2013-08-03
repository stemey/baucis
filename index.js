// __Dependencies__
var url = require('url');
var express = require('express');
var Controller = require('./Controller');
var generateResourceListing = require('./swagger')

// __Private Members__
var controllers = [];

// __Module Definition__
var baucis = module.exports = function (options) {
  options || (options = {});

  var app = express();

  // Set options on the app
  Object.keys(options).forEach(function (key) {
    app.set(key, options[key]);
  });

  app.set('controllers', controllers);

  // Mount all published controllers to the baucis app
  controllers.forEach(function (controller) {
    var route = url.resolve('/', controller.get('plural'));
    controller.initialize();
    app.use(route, controller);
  });

  // Activate Swagger resource listing if the option is enabled
  if (app.get('swagger') === true) {
    app.get('/api-docs.json', function (request, response, next) {
      response.json(generateResourceListing(app.get('controllers')));
    });
  }

  controllers = [];

  return app;
};

// __Public Methods__
baucis.rest = function (options) {
  var controller = Controller(options);

  // Publish unless told not to
  if (options.publish !== false) controllers.push(controller);

  return controller;
};
