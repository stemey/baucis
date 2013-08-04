// __Dependencies__
var url = require('url');
var express = require('express');
var mongoose = require('mongoose');
var Controller = require('./Controller');

// __Private Module Members__
var controllers = [];

function swaggerTypeFor (type) {
  if (type === String) return 'string';
  if (type === Number) return 'double';
  if (type === Date) return 'Date';
  if (type === mongoose.Schema.Types.Buffer) throw new Error('Not implemented');
  if (type === Boolean) return 'boolean';
  if (type === mongoose.Schema.Types.Mixed) throw new Error('Not implemented');
  if (type === mongoose.Schema.Types.ObjectId) return 'string';
  if (type === mongoose.Schema.Types.Oid) return 'string';
  if (type === mongoose.Schema.Types.Array) return 'Array';
  throw new Error('Unrecognized type:' + type);
};

// A method for capitalizing the first letter of a string
function capitalize (s) {
  if (!s) return s;
  if (s.length === 1) return s.toUpperCase();
  return s[0].toUpperCase() + s.substring(1);
}

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

// A method used to generate a Swagger model definition for a controller
function generateModelDefinition (controller) {
  var definition = {};
  var schema = controller.get('schema');

  definition.id = capitalize(controller.get('singular'));
  definition.properties = {};

  Object.keys(schema.paths).forEach(function (name) {
    var property = {};
    var path = schema.paths[name];

    if (path.selected === false) return;
    // TODO also check controller options

    property.type = swaggerTypeFor(path.options.type);
    property.required = path.options.required || (name === '_id');

    // Set enum values if applicable
    if (path.enumValues && path.enumValues.length > 0) {
      property.allowableValues = { valueType: 'LIST', values: path.enumValues };
    }

    // Set allowable values range if min or max is present
    if (!isNaN(path.options.min) || !isNaN(path.options.max)) {
      property.allowableValues = { valueType: 'RANGE' };
    }

    if (!isNaN(path.options.min)) {
      property.allowableValues.min = path.options.min;
    }

    if (!isNaN(path.options.max)) {
      property.allowableValues.max = path.options.max;
    }

    definition.properties[name] = property;
  });

  return definition;
}

// A method used to generate a Swagger API definition for a controller
function generateApiDefinition (controller, plural) {
  var definition = {};

  definition.path = '/' + controller.get('plural');
  if (plural) definition.path += '/{id}';

  if (plural) definition.description = 'Operations about a given ' + controller.get('singular');
  else definition.description = 'Operations about ' + controller.get('plural');

  definition.operations = [];

  controller.activeVerbs().forEach(function (verb) {
    var operation = {};
    var titlePlural = capitalize(controller.get('plural'));
    var titleSingular = capitalize(controller.get('singular'));

    // Don't do post/put for single/plural
    if (verb === 'post' && !plural) return;
    if (verb === 'put' && plural) return;

    operation.httpMethod = verb.toUpperCase();

    if (plural) operation.nickname = verb + titlePlural;
    else operation.nickname = verb + titleSingular + 'ById';

    if (plural) operation.responseClass = [ titleSingular ];
    else operation.responseClass = titleSingular;

    operation.parameters = []; // TODO

    if (plural) operation.summary = capitalize(verb) + ' some ' + controller.get('plural');
    else operation.summary = capitalize(verb) + ' a ' + controller.get('singular') + ' by its unique ID';

    operation.errorResponses = []; // TODO 404

    definition.operations.push(operation);
  });

  return definition;
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
