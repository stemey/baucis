// __Dependencies__

var util = require('util');
var express = require('express');
var mongoose = require('mongoose');
var lingo = require('lingo');
var userMiddlewareSchema = require('./userMiddlewareSchema');
var middleware = require('./middleware');

// __Private Static Members__

// Cascade optional paramaters into a single hash
function cascadeArguments (stage, howMany, verbs, middleware) {
  if (!stage) throw new Error('Must supply stage.');
  if (!middleware && !verbs && !howMany) throw new Error('Too few arguments.');

  if (!middleware && !verbs) {
    middleware = howMany;
    delete verbs;
    delete howMany;
  }

  if (!middleware) {
    middleware = verbs;
    verbs = howMany;
    delete howMany;
  }

  if (middleware.verbs) middleware.verbs = middleware.verbs.toLowerCase();

  return { stage: stage, howMany: howMany, verbs: verbs, middleware: middleware };
}

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

// __Module Definition__
var Controller = module.exports = function (options) {

  // __Defaults__

  // Marshal string into a hash
  if (typeof options === 'string') options = { singular: options };

  // __Validation__
  if (!options.singular) throw new Error('Must provide the Mongoose schema name');
  if (options.basePath) {
    if (options.basePath.indexOf('/') !== 0) throw new Error('basePath must start with a "/"');
    if (options.basePath.lastIndexOf('/') === options.basePath.length - 1) throw new Error('basePath must not end with a "/"');
  }
  if (options.findBy && !mongoose.model(options.singular).schema.path(options.findBy).options.unique) {
    throw new Error('findBy path for ' + options.singular + ' not unique');
  }

  // __Private Instance Variables__

  var controller = express();
  var initialized = false;
  var model = mongoose.model(options.singular);
  var userMiddlewareFor = userMiddlewareSchema();
  var basePath = options.basePath ? options.basePath : '/';
  var separator = (basePath === '/' ? '' : '/');
  var basePathWithId = basePath + separator + ':id';
  var basePathWithOptionalId = basePath + separator + ':id?';

  // __Private Instance Methods__

  // Parse the options hash and recurse `f` with parsed paramaters.  Execute `g`
  // for each verb.
  function traverseMiddleware (options, f, g) {
    if (!options.stage) throw new Error('Must supply stage.');
    if (!options.middleware) throw new Error('Must supply middleware.');

    var verbs = options.verbs || 'head get post put del';

    if (!Array.isArray(options.middleware) && typeof options.middleware !== 'function') {
      Object.keys(options.middleware).forEach(function (howManyKey) {
        Object.keys(options.middleware[howManyKey]).forEach(function (verb) {
          f({
            stage: options.stage,
            howMany: howManyKey,
            verbs: verb,
            middleware: options.middleware[howManyKey][verb]
          });
        });
      });
      return;
    }

    verbs.split(' ').forEach(g);
  }

  // A method used to register user middleware to be activated during intialization.
  function registerMiddleware (options) {
    if (initialized) {
      throw new Error("Can't add middleware after the controller has been initialized.");
    }

    if (options.stage === 'query' && options.verbs && options.verbs.indexOf('post') !== -1) {
      throw new Error('Query stage not executed for POST.');
    }

    traverseMiddleware(options, registerMiddleware, function (verb) {
      if (controller.get(verb) === false) return;

      if (options.howMany !== 'collection') {
        userMiddlewareFor[options.stage]['instance'][verb] = userMiddlewareFor[options.stage]['instance'][verb].concat(options.middleware);
      }
      if (options.howMany !== 'instance') {
        userMiddlewareFor[options.stage]['collection'][verb] = userMiddlewareFor[options.stage]['collection'][verb].concat(options.middleware);
      }
    });
  }

  // A method used to activate user middleware that was previously registered.
  function activateMiddleware (options) {
    if (initialized) throw new Error("Can't activate middleware after the controller has been initialized.");

    traverseMiddleware(options, activateMiddleware, function (verb) {
      if (controller.get(verb) === false) return;

      var path;

      if (!options.howMany) path = controller.get('basePathWithOptionalId');
      else if (options.howMany === 'instance') path = controller.get('basePathWithId');
      else if (options.howMany === 'collection') path = controller.get('basePath');
      else throw new Error('Unrecognized howMany.');

      controller[verb](path, options.middleware);
    });
  }

  // __Public Methods__

  // A method used to register request-stage middleware.
  controller.request = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('request', howMany, verbs, middleware);
    registerMiddleware(cascaded);
    return controller;
  };

  // A method used to register query-stage middleware.
  controller.query = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('query', howMany, verbs, middleware);
    // Prevent explicitly setting query-stage POST middleware.  Implicitly adding
    // this middleware is ignored.
    if (cascaded.verbs && cascaded.verbs.indexOf('post') !== -1) {
      throw new Error('POST cannot have query middleware');
    }
    registerMiddleware(cascaded);
    return controller;
  };

  // A method used to register document-stage middleware.
  controller.documents = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('documents', howMany, verbs, middleware);
    registerMiddleware(cascaded);
    return controller;
  };

  // Return the array of active verbs
  controller.activeVerbs = function () {
    return [ 'head', 'get', 'post', 'put', 'del' ].filter(function (verb) {
      return controller.get(verb) !== false;
    });
  }

  // A method used to generate a Swagger model definition for a controller
  controller.generateModelDefinition = function () {
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
  };

  controller.generateParameters = function (plural) {
    var parameters = [];

    // Parameters available for singular routes
    if (!plural) {
      parameters.push({
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
      parameters.push({
        paramType: 'query',
        name: 'skip',
        description: 'How many documents to skip.',
        dataType: 'int',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'limit',
        description: 'The maximum number of documents to send.',
        dataType: 'int',
        required: false,
        allowMultiple: false
      });
    }

    // Parameters available for singular and plural routes
    parameters.push({
      paramType: 'query',
      name: 'select',
      description: 'Select which fields will be returned by the query.',
      dataType: 'string',
      required: false,
      allowMultiple: false
    });

    parameters.push({
      paramType: 'query',
      name: 'populate',
      description: 'Population options.',
      dataType: 'string',
      required: false,
      allowMultiple: false
    });

    return parameters;
  };

  controller.generateErrorResponses = function (plural) {
    var errorResponses = [];

    // Error rosponses for singular operations
    if (!plural) {
      errorResponses.push({
        code: 404,
        reason: 'No ' + controller.get('singular') + ' was found with that ID.'
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
  };

  controller.generateOperations = function (plural) {
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

      operation.parameters = controller.generateParameters(plural);
      operation.errorResponses = controller.generateErrorResponses(plural);

      operations.push(operation);
    });

    return operations;
  };

  // A method used to generate a Swagger API definition for a controller
  controller.generateApiDefinition = function () {
    var modelName = capitalize(controller.get('singular'));
    var definition = {
      apiVersion: '0.0.1', // TODO
      swaggerVersion: '1.2',
      basePath: 'http://127.0.0.1:8012/api/v1', // TODO
      resourcePath: '/' + controller.get('plural'),
      apis: [],
      models: {}
    };

    // Model
    definition.models[modelName] = controller.generateModelDefinition();

    // Instance route
    definition.apis.push({
      path: '/' + controller.get('plural') + '/{id}',
      description: 'Operations about a given ' + controller.get('singular'),
      operations: controller.generateOperations(false)
    });

    // Collection route
    definition.apis.push({
      path: '/' + controller.get('plural'),
      description: 'Operations about ' + controller.get('plural'),
      operations: controller.generateOperations(true)
    });

    return definition;
  };

  // A method used to intialize the controller and activate user middleware.  It
  // may be called multiple times, but will trigger intialization only once.
  controller.initialize = function () {
    if (initialized) return controller;

    // __Request-Stage Middleware__

    // Activate middleware that sets the Allow & Accept headers
    activateMiddleware({
      stage: 'request',
      middleware: [ middleware.headers.allow, middleware.headers.accept ]
    });

    // Activate middleware to set request.baucis.conditions for find/remove
    activateMiddleware({
      stage: 'request',
      howMany: 'collection',
      verbs: 'head get del',
      middleware: middleware.configure.conditions
    });
    // Next, activate the request-stage user middleware.
    activateMiddleware({
       stage: 'request',
       middleware: userMiddlewareFor['request']
    });
    // Activate middleware to build the query (except for POST requests).
    activateMiddleware({
      stage: 'request',
      middleware: middleware.query
    });

    // __Query-Stage Middleware__
    // The query will have been created (except for POST, which doesn't use a
    // find or remove query).

    // Activate middleware to handle controller and query options.
    activateMiddleware({
      stage: 'query',
      middleware: [ middleware.configure.controller, middleware.configure.query ]
    });

    // Delete any query-stage POST middleware that was added implicitly.
    userMiddlewareFor.query.instance.post = [];
    userMiddlewareFor.query.collection.post = [];

    // Activate user middleware for the query-stage
    activateMiddleware({
      stage: 'query',
      middleware: userMiddlewareFor['query']
    });

    // Activate middleware to execute the query:

    // Get the count for HEAD requests.
    activateMiddleware({
      stage: 'query',
      verbs: 'head',
      middleware: middleware.exec.count
    });
    // Execute the find or remove query for GET and DELETE.
    activateMiddleware({
      stage: 'query',
      verbs: 'get del',
      middleware: middleware.exec.exec
    });
    // Create the documents for a POST request.
    activateMiddleware({
      stage: 'query',
      howMany: 'collection',
      verbs: 'post',
      middleware: middleware.exec.create
    });
    // Update the documents specified for a PUT request.
    activateMiddleware({
      stage: 'query',
      howMany: 'instance',
      verbs: 'put',
      middleware: middleware.exec.update
    });

    // Activate some middleware that will set the Link header when that feature
    // is enabled.  (This must come after exec or else the count is
    // returned for all subsequqent executions of the query.)
    if (this.get('relations') === true) {
      activateMiddleware({
        stage: 'query',
        howMany: 'instance',
        middleware: middleware.headers.link
      });
      activateMiddleware({
        stage: 'query',
        howMany: 'collection',
        middleware: middleware.headers.linkCollection
      });
    }

    // __Document-Stage Middleware__

    // Activate the middleware that sets the `Last-Modified` header when appropriate.
    activateMiddleware({
      stage: 'documents',
      middleware: middleware.documents.lastModified
    });
    // Activate the the document-stage user middleware.
    activateMiddleware({
      stage: 'documents',
      middleware: userMiddlewareFor['documents']
    });
    // Activate the middleware that sends the resulting document(s) or count.
    activateMiddleware({
      stage: 'documents',
      middleware: middleware.documents.send
    });

    initialized = true;
    return controller;
  };

  // __Configuration__

  Object.keys(options).forEach(function (key) {
    controller.set(key, options[key]);
  });

  controller.set('model', model);
  controller.set('schema', model.schema);
  controller.set('plural', options.plural || lingo.en.pluralize(options.singular));
  controller.set('findBy', options.findBy || '_id');

  controller.set('basePath', basePath);
  controller.set('basePathWithId', basePathWithId);
  controller.set('basePathWithOptionalId', basePathWithOptionalId);

  // __Initial Middleware__

  // Middleware for parsing JSON requests
  controller.use(express.json());

  // Initialize baucis state
  controller.use(function (request, response, next) {
    request.baucis = {};
    next();
  });

  return controller;
};

util.inherits(Controller, express);
