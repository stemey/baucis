// __Dependencies__
var url = require('url');
var express = require('express');
var mongoose = require('mongoose');
var Controller = require('./Controller');

// __Private Members__
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
  throw new Error('Unrecognized type: ' + type);
};

// A method for capitalizing the first letter of a string
function capitalize (s) {
  if (!s) return s;
  if (s.length === 1) return s.toUpperCase();
  return s[0].toUpperCase() + s.substring(1);
}

// A method for generating a Swagger resource listing
function generateResourceListing (controllers) {
  var listing = {
    apiVersion: '0.0.1', // TODO
    swaggerVersion: '1.1',
    basePath: 'http://127.0.0.1:8012/api/v1', // TODO
    apis: [],
    models: {}
  };

  controllers.forEach(function (controller) {
    var modelName = capitalize(controller.get('singular'));
    listing.models[modelName] = generateModelDefinition(controller);
    listing.apis.push(generateApiDefinition(controller, true));
    //listing.apis.push(generateApiDefinition(controller, false));
  });

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
    var select = controller.get('select');

    // Keep deselected paths private
    if (path.selected === false) return;
    if (select && select.match('-' + name)) return;

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

function generateParameter (controller, plural) {
  var parameters = [];

  // Parameters available for singular routes
  if (!plural) {
    operation.parameters.push({
      paramType: 'path',
      name: 'id',
      description: 'The ID of a ' + controller.get('singular'),
      dataType: 'string',
      required: true,
      allowMultiple: false
    });
  }

  // Parameters available for plural routes
  if (plural) {
    operation.parameters.push({
      paramType: 'query',
      name: 'skip',
      description: 'How many documents to skip.',
      dataType: 'int',
      required: false,
      allowMultiple: false
    });

    operation.parameters.push({
      paramType: 'query',
      name: 'limit',
      description: 'The maximum number of documents to send.',
      dataType: 'int',
      required: false,
      allowMultiple: false
    });
  }

  // Parameters available for singular and plural routes
  operation.parameters.push({
    paramType: 'query',
    name: 'select',
    description: 'Select which fields will be returned by the query.',
    dataType: 'string',
    required: false,
    allowMultiple: false
  });

  operation.parameters.push({
    paramType: 'query',
    name: 'populate',
    description: 'Population options.',
    dataType: 'string',
    required: false,
    allowMultiple: false
  });

  return parameters;
}

function generateErrorResponses (controller, plural) {
  var errorResponses = [];

  // Error rosponses for singular operations
  if (!plural) {
    errorResponses.push({
      code: 404,
      reason: 'No ' + controller.get('singular') + ' was found with that ID.' }
    });
  }

  // Error rosponses for plural operations
  if (plural) {
    errorResponses.push({
      code: 404,
      reason: 'No ' + controller.get('plural') + ' matched that query.'
    });
  }

  // Error rosponses for both singular and plural operations
  // None.

  return errorResponses;
}

function generateOperations (controller, plural) {
  var operations = [];

  controller.activeVerbs().forEach(function (verb) {
    var operation = {};
    var titlePlural = capitalize(controller.get('plural'));
    var titleSingular = capitalize(controller.get('singular'));

    // Don't do post/put for single/plural
    if (verb === 'post' && !plural) return;
    if (verb === 'put' && plural) return;

    // Use the full word
    if (verb === 'del') verb = 'delete';

    operation.httpMethod = verb.toUpperCase();

    if (plural) operation.nickname = verb + titlePlural;
    else operation.nickname = verb + titleSingular + 'ById';

    if (plural) operation.responseClass = [ titleSingular ];
    else operation.responseClass = titleSingular;

    if (plural) operation.summary = capitalize(verb) + ' some ' + controller.get('plural');
    else operation.summary = capitalize(verb) + ' a ' + controller.get('singular') + ' by its unique ID';

    operation.parameters = generateParameters(controller, plural);
    operation.errorResponses = generateErrorResponses(controller, plural);

    operations.push(operation);
  });

  return operations;
}

// A method used to generate a Swagger API definition for a controller
function generateApiDefinition (controller, plural) {
  var definition = {};

  definition.path = '/' + controller.get('plural');
  if (!plural) definition.path += '/{id}'; // TODO why is this breaking swagger-ui?

  if (plural) definition.description = 'Operations about ' + controller.get('plural');
  else definition.description = 'Operations about a given ' + controller.get('singular');

  definition.operations = generateOperations(controller, plural));

  return definition;
}

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
