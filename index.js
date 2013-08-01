// __Dependencies__
var url = require('url');
var express = require('express');
var Controller = require('./Controller');

// __Private Members__
var controllers = [];
var app = express();
var swaggerTypeFor = {
  'String': 'string',
  'Number': 'double',
  'Date': 'Date',
  'Buffer': 'TODO',
  'Boolean': 'boolean',
  'Mixed': 'TODO',
  'Objectid': 'string',
  'Array': 'Array'
};

// A method for capitalizing the first letter of a string
function captialize (s) {
  if (!s) return s;
  if (s.length === 1) return s.toUpperCase();
  return s[0].toUpperCase() + s.substring(1);
}

// A method for generating a Swagger resource listing
function generateResourceListing () {
  var listing = {
    apiVersion: '0.0', // TODO
    swaggerVersion: '1.1',
    basePath: 'http://127.0.0.1/api', // TODO
    apis: [],
    models: {}
  };

  controllers.forEach(function (controller) {
    var modelName = capitalize(controller.get('singular'));
    listing.models[modelName] = generateModelDefinition(controller);
    listing.apis.push(generateApiDefinition(controller, true));
    listing.apis.push(generateApiDefinition(controller, false));
  });

  return listing;
}

// A method used to generate a Swagger model definition for a controller
function generateModelDefinition (controller) {
  var definition = {};
  var schema = mongoose.model(controller.get('singular')).schema;

  definition.id = capitalize(controller.get('singular'));
  definition.properties = {};

  Object.keys(schema.paths).forEach(function (name) {
    var property = {};
    var path = schema.paths[name];

    property.type = swaggerTypeFor[path.instance];
    property.required = path.options.required ? true : false;

    // Set enum values if applicable
    if (path.enumValues.length > 0) {
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

    controller.activatedVerbs().forEach(function (verb) {
      var operation = {};
      var titlePlural = capitalize(controller.get('plural'));
      var titleSingular = capitalize(controller.get('singular'));

      // TODO don't do post/put for single/plural

      operation.httpMethod = verb.toUpperCase();

      if (plural) operation.nickname = verb + titlePlural;
      else operation.nickname = verb + titleSingular + 'ById';

      if (plural) operation.responseClass = [ titleSingular ];
      else operation.responseClass = titleSingular;

      operation.parameters = []; // TODO

      if (plural) operation.summary = 'Find some ' + controller.get('plural');
      else operation.summary = 'Find a ' + controller.get('singular') + ' by its unique ID';

      operation.errorResponses = []; // TODO 404

      definition.operations.push(operation);
    });

    return definition;
  };
}

// __Module Definition__
var baucis = module.exports = function (options) {
  options || (options = {});

  // Set options on the app
  Object.keys(options).forEach(function (key) {
    app.set(key, options[key]);
  });

  // Mount all published controllers to the baucis app
  controllers.forEach(function (controller) {
    var route = url.resolve('/', controller.get('plural'));
    controller.initialize();
    app.use(route, controller);
  });

  return app;
};

// __Public Methods__
baucis.rest = function (options) {
  var controller = Controller(options);

  // Publish unless told not to
  if (options.publish !== false) controllers.push(controller);

  return controller;
};

// __Routes__
app.get('/api-docs.json', function (request, response, next) {
  response.json(generateResourceListing());
});
