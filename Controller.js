// Dependencies
// ------------
var util = require('util');
var express = require('express');
var mongoose = require('mongoose');
var lingo = require('lingo');
var url = require('url');

var middleware = {
  configure: require('./middleware/configure'),
  documents: require('./middleware/documents'),
  exec: require('./middleware/exec'),
  headers: require('./middleware/headers'),
  query: require('./middleware/query')
};

// Private Static Members
// ----------------------

// Create a data structure to store user-defined middleware
function createEmptyMiddlewareHash () {
  var middleware = {};
  var stages = ['request', 'query', 'documents'];
  var howManys = ['instance', 'collection'];
  var verbs = ['head', 'get', 'post', 'put', 'del'];

  stages.forEach(function (stage) {
    middleware[stage] = {};
    howManys.forEach(function (howMany) {
      middleware[stage][howMany] = {};
      verbs.forEach(function (verb) {
        middleware[stage][howMany][verb] = [];
      });
    });
  });

  return middleware;
}

// Cascade optional paramaters into a single hash
function cascadeArguments (stage, howMany, verbs, middleware) {
  if (!stage) throw new Error('Must supply stage.');
  if (!middleware && !verbs && !howMany) throw new Error('Too few arguments.');

  if (!middleware && !verbs) {
    middleware = howMany;
    verbs = undefined;
    howMany = undefined;
  }

  if (!middleware) {
    middleware = verbs;
    verbs = howMany;
    howMany = undefined;
  }

  if (middleware.verbs) middleware.verbs = middleware.verbs.toLowerCase();

  return { stage: stage, howMany: howMany, verbs: verbs, middleware: middleware };
}

// Module Definition
var Controller = module.exports = function (options) {
  // Marshal string into a hash
  if (typeof options === 'string') options = { singular: options };

  // Validate singular & basePath
  if (!options.singular) throw new Error('Must provide the Mongoose schema name');
  if (options.basePath) {
    if (options.basePath.indexOf('/') !== 0) throw new Error('basePath must start with a "/"');
    if (options.basePath.lastIndexOf('/') === options.basePath.length - 1) throw new Error('basePath must not end with a "/"');
  }

  // *Private Instance Members*
  var controller = express();
  var initialized = false;
  var model = mongoose.model(options.singular);
  var userMiddlewareFor = createEmptyMiddlewareHash();
  var basePath = options.basePath ? options.basePath : '/';
  var separator = (basePath === '/' ? '' : '/');
  var basePathWithId = basePath + separator + ':id';
  var basePathWithOptionalId = basePath + separator + ':id?';

  // Validate findBy
  if (options.findBy && !model.schema.path(options.findBy).options.unique) {
    throw new Error('findBy path for ' + options.singular + ' not unique');
  }

  // *Private Instance Methods*
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

  // Register user middleware to be activated later
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

  // Activate user middleware that was registered previously
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

  // Public Methods
  // --------------
  controller.request = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('request', howMany, verbs, middleware);
    registerMiddleware(cascaded);
    return controller;
  };

  controller.query = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('query', howMany, verbs, middleware);
    // Prevent explicitly setting query:post middleware.  Implicitly adding
    // query:post middleware is ignored.
    if (cascaded.verbs && cascaded.verbs.indexOf('post') !== -1) {
      throw new Error('POST cannot have query middleware');
    }
    registerMiddleware(cascaded);
    return controller;
  };

  controller.documents = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('documents', howMany, verbs, middleware);
    registerMiddleware(cascaded);
    return controller;
  };

  controller.initialize = function () {
    if (initialized) return controller;

    // Allow/Accept headers
    activateMiddleware({
      stage: 'request',
      middleware: [ middleware.headers.allow, middleware.headers.accept ]
    });

    // Process the request before building the query.
    activateMiddleware({
      stage: 'request',
      howMany: 'collection',
      verbs: 'head get del',
      middleware: middleware.configure.conditions
    });
    activateMiddleware({
       stage: 'request',
       middleware: userMiddlewareFor['request']
    });
    activateMiddleware({
      stage: 'request',
      middleware: middleware.query
    });

    // Query has been created (except for POST)
    activateMiddleware({
      stage: 'query',
      middleware: [ middleware.configure.controller, middleware.configure.query ]
    });

    // Delete any POST-stage query middleware that was added implicitly
    delete userMiddlewareFor['query']['instance']['post'];
    delete userMiddlewareFor['query']['collection']['post'];

    activateMiddleware({
      stage: 'query',
      verbs: 'head get put del',
      middleware: userMiddlewareFor['query']
    });
    activateMiddleware({
      stage: 'query',
      verbs: 'head',
      middleware: middleware.exec.count
    });
    activateMiddleware({
      stage: 'query',
      verbs: 'get del',
      middleware: middleware.exec.exec
    });
    activateMiddleware({
      stage: 'query',
      howMany: 'collection',
      verbs: 'post',
      middleware: middleware.exec.create
    });
    activateMiddleware({
      stage: 'query',
      howMany: 'instance',
      verbs: 'put',
      middleware: middleware.exec.update
    });

    // Set Link header if desired (must come after exec or else query gets count)
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

    // Documents/count have/has been created
    activateMiddleware({
      stage: 'documents',
      middleware: middleware.documents.lastModified
    });
    activateMiddleware({
      stage: 'documents',
      middleware: userMiddlewareFor['documents']
    });
    activateMiddleware({
      stage: 'documents',
      middleware: middleware.documents.send
    });

    // The controller is initialized and we don't need the intermiediate data
    // structure any more.
    delete userMiddlewareFor;
    initialized = true;

    return controller;
  };

  // Configuration
  // -------------
  Object.keys(options).forEach(function (key) {
    controller.set(key, options[key]);
  });

  controller.set('model', model);
  controller.set('plural', options.plural || lingo.en.pluralize(options.singular));
  controller.set('findBy', options.findBy || '_id');

  controller.set('basePath', basePath);
  controller.set('basePathWithId', basePathWithId);
  controller.set('basePathWithOptionalId', basePathWithOptionalId);

  // Basic middleware
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
