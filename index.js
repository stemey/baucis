// __Dependencies__
var url = require('url');
var express = require('express');
var Controller = require('./Controller');

// __Private Module Members__
var controllers = [];

// A method for generating a Swagger resource listing
function generateResourceListing () {
  var plurals = this.get('controllers').map(function (controller) {
    return controller.get('plural');
  });
  var listing = {
    apiVersion: '0.0.1', // TODO
    swaggerVersion: '1.1',
    basePath: 'http://127.0.0.1:8012/api/v1', // TODO
    apis: plurals.map(function (plural) {
      return { path: '/api-docs/' + plural, description: 'Operations about ' + plural + '.' };
    })
  };

  return listing;
}

// __Module Definition__
var baucis = module.exports = function (options) {
  options || (options = {});

  var app = express();

  // __Public App Members__
  app.generateResourceListing = generateResourceListing.bind(app);
  app.set('controllers', controllers);

  // Set options on the app
  Object.keys(options).forEach(function (key) {
    app.set(key, options[key]);
  });

  // Activate Swagger resource listing if the option is enabled
  if (app.get('swagger') === true) {
    app.get('/api-docs', function (request, response, next) {
      response.json(app.generateResourceListing());
    });
  }

  // Mount all published controllers to the baucis app
  controllers.forEach(function (controller) {
    var route = url.resolve('/', controller.get('plural'));

    // Add a route for the controller's Swagger API definition
    if (app.get('swagger')) {
      app.get('/api-docs' + route, function (request, response, next) {
        response.json(controller.generateApiDefinition());
      });
    }

    // Initialize and mount the controller
    controller.initialize();
    app.use(route, controller);
  });

  // Empty the controllers array to prepare for creating more APIs
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
