// This is a Controller mixin for adding methods to manage middleware creation.

// __Private Module Members__

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

// A method used to activate user middleware that was previously registered.
function activate (options) {
  if (activated) throw new Error("Can't activate middleware after the controller has been activated.");

  var that = this;

  traverseMiddleware(options, activate, function (verb) {
    if (that.get(verb) === false) return;

    var path;

    if (!options.howMany) path = that.get('basePathWithOptionalId');
    else if (options.howMany === 'instance') path = that.get('basePathWithId');
    else if (options.howMany === 'collection') path = that.get('basePath');
    else throw new Error('Unrecognized howMany.');

    that[verb](path, options.middleware);
  });
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

    traverseMiddleware(options, register, function (verb) {
      if (controller.get(verb) === false) return;

      if (options.howMany !== 'collection') {
        custom[options.stage]['instance'][verb] = custom[options.stage]['instance'][verb].concat(options.middleware);
      }
      if (options.howMany !== 'instance') {
        custom[options.stage]['collection'][verb] = custom[options.stage]['collection'][verb].concat(options.middleware);
      }
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

    var add = activate.bind(this);

    // __Request-Stage Middleware__

    // Activate middleware that sets the Allow & Accept headers
    add({
      stage: 'request',
      middleware: [ middleware.headers.allow, middleware.headers.accept ]
    });

    // Activate middleware to set request.baucis.conditions for find/remove
    add({
      stage: 'request',
      howMany: 'collection',
      verbs: 'head get del',
      middleware: middleware.configure.conditions
    });
    // Next, activate the request-stage user middleware.
    add({
       stage: 'request',
       middleware: custom['request']
    });
    // Activate middleware to build the query (except for POST requests).
    add({
      stage: 'request',
      middleware: middleware.query
    });

    // __Query-Stage Middleware__
    // The query will have been created (except for POST, which doesn't use a
    // find or remove query).

    // Activate middleware to handle controller and query options.
    add({
      stage: 'query',
      middleware: [ middleware.configure.controller, middleware.configure.query ]
    });

    // Delete any query-stage POST middleware that was added implicitly.
    middleware.query.instance.post = [];
    middleware.query.collection.post = [];

    // Activate user middleware for the query-stage
    add({
      stage: 'query',
      middleware: custom['query']
    });

    // Activate middleware to execute the query:

    // Get the count for HEAD requests.
    add({
      stage: 'query',
      verbs: 'head',
      middleware: middleware.exec.count
    });
    // Execute the find or remove query for GET and DELETE.
    add({
      stage: 'query',
      verbs: 'get del',
      middleware: middleware.exec.exec
    });
    // Create the documents for a POST request.
    add({
      stage: 'query',
      howMany: 'collection',
      verbs: 'post',
      middleware: middleware.exec.create
    });
    // Update the documents specified for a PUT request.
    add({
      stage: 'query',
      howMany: 'instance',
      verbs: 'put',
      middleware: middleware.exec.update
    });

    // Activate some middleware that will set the Link header when that feature
    // is enabled.  (This must come after exec or else the count is
    // returned for all subsequqent executions of the query.)
    if (this.get('relations') === true) {
      add({
        stage: 'query',
        howMany: 'instance',
        middleware: middleware.headers.link
      });
      add({
        stage: 'query',
        howMany: 'collection',
        middleware: middleware.headers.linkCollection
      });
    }

    // __Document-Stage Middleware__

    // Activate the middleware that sets the `Last-Modified` header when appropriate.
    add({
      stage: 'documents',
      middleware: middleware.documents.lastModified
    });
    // Activate the the document-stage user middleware.
    add({
      stage: 'documents',
      middleware: custom['documents']
    });
    // Activate the middleware that sends the resulting document(s) or count.
    add({
      stage: 'documents',
      middleware: middleware.documents.send
    });

    delete custom;
    activated = true;
    return this;
  };
