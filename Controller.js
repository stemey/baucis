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
  query: require('./middleware/query'),
  send: require('./middleware/send')
};

// Private Static Members
// ----------------------
function createEmptyMiddlewareHash () {
  var o = {};

  ['request', 'query', 'documents'].forEach(function (stage) {
    o[stage] = {};
    ['instance', 'collection'].forEach(function (howMany) {
      o[stage][howMany] = {};
      ['head', 'get', 'post', 'put', 'del'].forEach(function (verb) {
        o[stage][howMany][verb] = [];
      });
    });
  });

  return o;
}

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

  return { stage: stage, howMany: howMany, verbs: verbs, middleware: middleware };
}

// Module Definition
// -----------------
var Controller = module.exports = function (options) {
  // Validation
  // ----------
  if (!options.singular) throw new Error('Must provide the Mongoose schema name');
  if (options.basePath && options.basePath !== '/') {
    if (options.basePath.indexOf('/') !== 0) throw new Error('basePath must start with a "/"');
    if (options.basePath.lastIndexOf('/') === options.basePath.length - 1) throw new Error('basePath must not end with a "/"');
  }

  // Private Instance Members
  // --------------------------
  var controller = express();
  var initialized = false;
  var userMiddlewareFor = createEmptyMiddlewareHash();
  var basePath = options.basePath ? options.basePath : '/';
  var separator = (basePath === '/' ? '' : '/');
  var basePathWithId = basePath + separator + ':id';
  var basePathWithOptionalId = basePath + separator + ':id?';

  function traverseMiddleware (options, f, g) {
    if (!options.stage) throw new Error('Must suppy stage.');
    if (!options.middleware) throw new Error('Must suppy middleware.');

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

  function registerMiddleware (options) {
    if (initialized) throw new Error("Can't add middleware after the controller has been initialized.");

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
  };

  controller.query = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('query', howMany, verbs, middleware);
    registerMiddleware(cascaded);
  };

  controller.documents = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('documents', howMany, verbs, middleware);
    registerMiddleware(cascaded);
  };

  controller.initialize = function () {
    var that = this;

    if (initialized) return;

    // Middleware for parsing JSON requests
    this.use(express.json());

    // Initialize baucis state
    this.use(function (request, response, next) {
      request.baucis = {};
      next();
    });

    // Allow/Accept headers
    activateMiddleware({
      stage: 'request',
      middleware: [ middleware.headers.allow, middleware.headers.accept ]
    });

    // Set Link header if desired
    if (this.get('relations') === true) {
      activateMiddleware({
        stage: 'request',
        howMany: 'instance',
        middleware: middleware.headers.link
      });
      activateMiddleware({
        stage: 'request',
        howMany: 'collection',
        middleware: middleware.headers.linkCollection
      });
    }

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

    // Query has been created
    activateMiddleware({
      stage: 'query',
      middleware: [ middleware.configure.controller, middleware.configure.query ]
    });
    activateMiddleware({
      stage: 'query',
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
      howMany: 'instance',
      verbs: 'post',
      middleware: middleware.exec.exec
    });
    activateMiddleware({
      stage: 'query',
      howMany: 'collection',
      verbs: 'put',
      middleware: middleware.exec.exec
    });

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

    delete userMiddlewareFor;
    initialized = true;
  };

  // Configuration
  // -------------
  Object.keys(options).forEach(function (key) {
    controller.set(key, options[key]);
  });

  controller.set('model', mongoose.model(options.singular));
  controller.set('plural', options.plural || lingo.en.pluralize(options.singular));
  controller.set('findBy', options.findBy || '_id');

  controller.set('basePath', basePath);
  controller.set('basePathWithId', basePathWithId);
  controller.set('basePathWithOptionalId', basePathWithOptionalId);

  return controller;
};

util.inherits(Controller, express);
