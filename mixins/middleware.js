// This is a Controller mixin for adding methods to manage middleware creation.

// __Dependencies__
var middleware = require('../middleware');

// __Private Module Members__

// Parse middleware
function factor (stage) {
  if (!stage) throw new Error('Must supply stage.');
  if (!arguments[3] && !arguments[2] && !arguments[1]) throw new Error('Too few arguments.');

  var factored = [];
  var base = arguments.length - 2;
  var howMany = base - 1 > 0 ? arguments[base - 1] : undefined;
  var verbs = base > 0 ? arguments[base] : undefined;
  var middleware = base + 1 > 0 ? arguments[base + 1] : undefined;

  if (verbs) verbs = verbs.toLowerCase();

  // Prevent explicitly setting query-stage POST middleware.  Implicitly adding
  // this middleware is ignored.
  if (stage === 'query' && verbs && verbs.indexOf('post') !== -1) {
    throw new Error('Query stage not executed for POST.');
  }

  // Middleware function or array
  if (Array.isArray(middleware) || typeof middleware === 'function') {
    if (howMany !== 'collection') factored.push({ stage: stage, howMany: 'instance', verbs: verbs, middleware: middleware });
    if (howMany !== 'instance') factored.push({ stage: stage, howMany: 'collection', verbs: verbs, middleware: middleware });
    return factored;
  }

  // Middleware hash keyed on instance/collection, then verb
  if (howMany) throw new Error('Specified instance/collection twice.');
  if (verbs) throw new Error('Specified verbs twice.');

  Object.keys(middleware).forEach(function (howManyKey) {
    Object.keys(middleware[howManyKey]).map(function (verb) {
      factored.push({
        stage: stage,
        howMany: howManyKey,
        verbs: verb,
        middleware: middleware[howManyKey][verb]
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
  function register (stage, howMany, verbs, middleware) {
    if (activated) {
      throw new Error("Can't add middleware after the controller has been activated.");
    }

    factor(stage, howMany, verbs, middleware).forEach(function (definition) {
      var verbs = definition.verbs || 'head get post put del';
      verbs.split(' ').forEach(function (verb) {
        if (controller.get(verb) === false) return;
        custom[definition.stage][definition.howMany][verb] = custom[definition.stage][definition.howMany][verb].concat(definition.middleware);
      });
    });
  }

  // A method used to activate user middleware that was previously registered.
  function activate (stage, howMany, verbs, middleware) {
    if (activated) throw new Error("Can't activate middleware after the controller has been activated.");

    var that = this;

    factor(stage, howMany, verbs, middleware).forEach(function (definition) {
      var verbs = definition.verbs || 'head get post put del';

      verbs.split(' ').forEach(function (verb) {
        if (that.get(verb) === false) return;

        var path;

        if (definition.howMany === 'instance') path = that.get('basePathWithId');
        else if (definition.howMany === 'collection') path = that.get('basePath');
        else throw new Error('Unrecognized howMany.');

        that[verb](path, definition.middleware);
      });
    });
  }

  // __Public Instance Methods__

  // A method used to register request-stage middleware.
  this.request = function (howMany, verbs, middleware) {
    register('request', howMany, verbs, middleware);
    return this;
  };

  // A method used to register query-stage middleware.
  this.query = function (howMany, verbs, middleware) {
    register('query', howMany, verbs, middleware);
    return this;
  };

  // A method used to register document-stage middleware.
  this.documents = function (howMany, verbs, middleware) {
    register('documents', howMany, verbs, middleware);
    return this;
  };

  // A method used to intialize the controller and activate user middleware.  It
  // may be called multiple times, but will trigger intialization only once.
  this.activate = function () {
    if (activated) return this;

    // __Request-Stage Middleware__

    // Activate middleware that sets the Allow & Accept headers
    activate.call(this, 'request', [ middleware.headers.allow, middleware.headers.accept ]);
    // Activate middleware to set request.baucis.conditions for find/remove
    activate.call(this, 'request', 'collection', 'head get del', middleware.configure.conditions);
    // Next, activate the request-stage user middleware.
    activate.call(this, 'request', custom['request']);
    // Activate middleware to build the query (except for POST requests).
    activate.call(this, 'request', middleware.query);

    // __Query-Stage Middleware__
    // The query will have been created (except for POST, which doesn't use a
    // find or remove query).

    // Activate middleware to handle controller and query options.
    activate.call(this, 'query', [ middleware.configure.controller, middleware.configure.query ]);

    // Delete any query-stage POST middleware that was added implicitly.
    custom.query.instance.post = [];
    custom.query.collection.post = [];

    // Activate user middleware for the query-stage
    activate.call(this, 'query', custom['query']);

    // Activate middleware to execute the query:

    // Get the count for HEAD requests.
    activate.call(this, 'query', 'head', middleware.exec.count);
    // Execute the find or remove query for GET and DELETE.
    activate.call(this, 'query', 'get del', middleware.exec.exec);
    // Create the documents for a POST request.
    activate.call(this, 'query', 'collection', 'post', middleware.exec.create);
    // Update the documents specified for a PUT request.
    activate.call(this, 'query', 'instance', 'put', middleware.exec.update);

    // Activate some middleware that will set the Link header when that feature
    // is enabled.  (This must come after exec or else the count is
    // returned for all subsequqent executions of the query.)
    if (this.get('relations') === true) {
      activate.call(this, 'query', 'instance', middleware.headers.link);
      activate.call(this, 'query', 'collection', middleware.headers.linkCollection);
    }

    // __Document-Stage Middleware__

    // Activate the middleware that sets the `Last-Modified` header when appropriate.
    activate.call(this, 'documents', middleware.documents.lastModified);
    // Activate the the document-stage user middleware.
    activate.call(this, 'documents', custom['documents']);
    // Activate the middleware that sends the resulting document(s) or count.
    activate.call(this, 'documents', middleware.documents.send);

    delete custom;
    activated = true;
    return this;
  };
};
