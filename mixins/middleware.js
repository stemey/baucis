// This is a Controller mixin for adding methods to manage middleware creation.

// __Dependencies__
var middleware = require('../middleware');

// __Private Module Members__

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

// Parse hashes of middleware into arrays of middleware
function factor (options) {
  if (!options.stage) throw new Error('Must supply stage.');
  if (!options.middleware) throw new Error('Must supply middleware.');

  if (Array.isArray(options.middleware) || typeof options.middleware === 'function') {
    return options.middleware;
  }

  var factored = [];

  Object.keys(options.middleware).forEach(function (howManyKey) {
    Object.keys(options.middleware[howManyKey]).forEach(function (verb) {
      factored.push({
        stage: options.stage,
        howMany: howManyKey,
        verbs: verb,
        middleware: options.middleware[howManyKey][verb]
      });
    });
  });

  return factored;
}

// __Module Definition__
var mixin = module.exports = function () {

  // __Private Instance Members__

  // Flags whether the custom middleware has been activated
  var activated = false;
  // A hash for storing user middleware
  var custom = {
    "request":
    { "instance": { "head": [], "get": [], "post": [], "put": [], "del": [] },
     "collection": { "head": [], "get": [], "post": [], "put": [], "del": [] }
    },
    "query":
    { "instance": { "head": [], "get": [], "post": [], "put": [], "del": [] },
     "collection": { "head": [], "get": [], "post": [], "put": [], "del": [] }
    },
    "documents":
    { "instance": { "head": [], "get": [], "post": [], "put": [], "del": [] },
     "collection": { "head": [], "get": [], "post": [], "put": [], "del": [] }
    }
  };

  // A method used to register user middleware to be activated during intialization.
  function register (options) {
    if (activated) {
      throw new Error("Can't add middleware after the controller has been activated.");
    }

    if (options.stage === 'query' && options.verbs && options.verbs.indexOf('post') !== -1) {
      throw new Error('Query stage not executed for POST.');
    }

    factor(options).forEach(function (definition) {
      var verbs = definition.verbs || 'head get post put del';
      verbs.split(' ').forEach(function (verb) {
        if (controller.get(verb) === false) return;

        if (definition.howMany !== 'collection') {
          custom[definition.stage]['instance'][verb] = custom[definition.stage]['instance'][verb].concat(definition.middleware);
        }
        if (definition.howMany !== 'instance') {
          custom[definition.stage]['collection'][verb] = custom[definition.stage]['collection'][verb].concat(definition.middleware);
        }
      });
    });
  }

  // A method used to activate user middleware that was previously registered.
  function activate (controller, options) {
    if (activated) throw new Error("Can't activate middleware after the controller has been activated.");

    factor(options).forEach(function (definition) {
      var verbs = definition.verbs || 'head get post put del';

      verbs.split(' ').forEach(function (verb) {
        if (controller.get(verb) === false) return;

        var path;

        if (!definition.howMany) path = controller.get('basePathWithOptionalId');
        else if (definition.howMany === 'instance') path = controller.get('basePathWithId');
        else if (definition.howMany === 'collection') path = controller.get('basePath');
        else throw new Error('Unrecognized howMany.');

        controller[verb](path, definition.middleware);
      });
    });
  }

  // __Public Instance Methods__

  // A method used to register request-stage middleware.
  this.request = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('request', howMany, verbs, middleware);
    register(cascaded);
    return this;
  };

  // A method used to register query-stage middleware.
  this.query = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('query', howMany, verbs, middleware);
    // Prevent explicitly setting query-stage POST middleware.  Implicitly adding
    // this middleware is ignored.
    if (cascaded.verbs && cascaded.verbs.indexOf('post') !== -1) {
      throw new Error('POST cannot have query middleware');
    }
    register(cascaded);
    return this;
  };

  // A method used to register document-stage middleware.
  this.documents = function (howMany, verbs, middleware) {
    var cascaded = cascadeArguments('documents', howMany, verbs, middleware);
    register(cascaded);
    return this;
  };

  // A method used to intialize the controller and activate user middleware.  It
  // may be called multiple times, but will trigger intialization only once.
  this.activate = function () {
    if (activated) return this;

    // __Request-Stage Middleware__

    // Activate middleware that sets the Allow & Accept headers
    activate(this, {
      stage: 'request',
      middleware: [ middleware.headers.allow, middleware.headers.accept ]
    });

    // Activate middleware to set request.baucis.conditions for find/remove
    activate(this, {
      stage: 'request',
      howMany: 'collection',
      verbs: 'head get del',
      middleware: middleware.configure.conditions
    });
    // Next, activate the request-stage user middleware.
    activate(this, {
       stage: 'request',
       middleware: custom['request']
    });
    // Activate middleware to build the query (except for POST requests).
    activate(this, {
      stage: 'request',
      middleware: middleware.query
    });

    // __Query-Stage Middleware__
    // The query will have been created (except for POST, which doesn't use a
    // find or remove query).

    // Activate middleware to handle controller and query options.
    activate(this, {
      stage: 'query',
      middleware: [ middleware.configure.controller, middleware.configure.query ]
    });

    // Delete any query-stage POST middleware that was added implicitly.
    middleware.query.instance.post = [];
    middleware.query.collection.post = [];

    // Activate user middleware for the query-stage
    activate(this, {
      stage: 'query',
      middleware: custom['query']
    });

    // Activate middleware to execute the query:

    // Get the count for HEAD requests.
    activate(this, {
      stage: 'query',
      verbs: 'head',
      middleware: middleware.exec.count
    });
    // Execute the find or remove query for GET and DELETE.
    activate(this, {
      stage: 'query',
      verbs: 'get del',
      middleware: middleware.exec.exec
    });
    // Create the documents for a POST request.
    activate(this, {
      stage: 'query',
      howMany: 'collection',
      verbs: 'post',
      middleware: middleware.exec.create
    });
    // Update the documents specified for a PUT request.
    activate(this, {
      stage: 'query',
      howMany: 'instance',
      verbs: 'put',
      middleware: middleware.exec.update
    });

    // Activate some middleware that will set the Link header when that feature
    // is enabled.  (This must come after exec or else the count is
    // returned for all subsequqent executions of the query.)
    if (this.get('relations') === true) {
      activate(this, {
        stage: 'query',
        howMany: 'instance',
        middleware: middleware.headers.link
      });
      activate(this, {
        stage: 'query',
        howMany: 'collection',
        middleware: middleware.headers.linkCollection
      });
    }

    // __Document-Stage Middleware__

    // Activate the middleware that sets the `Last-Modified` header when appropriate.
    activate(this, {
      stage: 'documents',
      middleware: middleware.documents.lastModified
    });
    // Activate the the document-stage user middleware.
    activate(this, {
      stage: 'documents',
      middleware: custom['documents']
    });
    // Activate the middleware that sends the resulting document(s) or count.
    activate(this, {
      stage: 'documents',
      middleware: middleware.documents.send
    });

    delete custom;
    activated = true;
    return this;
  };
};
