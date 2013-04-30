// Dependencies
// ------------
var express = require('express');
var mongoose = require('mongoose');
var lingo = require('lingo');
var path = require('path');

// Private Members
// ---------------
var app = express();

// Set a field or array off fields to be populated
function populateQuery (query, populate) {
  if (!query) throw new Error('Query was undefined');
  if (!populate) return;
  populate = JSON.parse(populate);
  if (!Array.isArray(populate)) populate = [ populate ];
  populate.forEach(function (field) { query.populate(field) });
}

// Module Definition
// -----------------
var baucis = module.exports = function (options) {
  options = options || {};

  //if (options.prefixUrl) app.set('urlPrefix', options.urlPrefix);

  return app;
};

// Default Settings
// ----------------
//app.set('urlPrefix', '/api');

// Middleware
// ----------
// Functions to return middleware for HTTP verbs

// Retrieve header for the addressed document
function head (options) {
  var f = function (request, response, next) {
    var id = request.params.id;
    var query = mongoose.model(options.singular).findById(id);

    if (options.restrict) options.restrict(query, request);
    populateQuery(query, request.query.populate);

    query.count(function (error, count) {
      if (error) return next(error);
      if (count === 0) return response.send(404);
      response.send(200);
    });
  };

  return f;
}

// Retrieve the addressed document
function get (options) {
  var f = function (request, response, next) {
    var id = request.params.id;
    var query = mongoose.model(options.singular).findById(id);

    if (options.restrict) options.restrict(query, request);
    populateQuery(query, request.query.populate);

    query.exec(function (error, doc) {
      if (error) return next(error);
      if (!doc) return response.send(404);
      response.json(doc);
    });
  };

  return f;
}

// Treat the addressed document as a collection, and push
// the addressed object to it
function post (options) {
  var f = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  };

  return f;
}

// Replace the addressed document, or create it if it doesn't exist
function put (options) {
  var f = function (request, response, next) {
    // Can't send id for update, even if unchanged
    delete request.body._id;

    var id = request.params.id || null;
    var create = (id === null);
    var query = mongoose.model(options.singular).findByIdAndUpdate(id, request.body, {upsert: true});

    if (options.restrict) options.restrict(query, request);
    populateQuery(query, request.query.populate);

    query.exec(function (error, doc) {
      if (error) return next(error);

      if (create) response.status(201);
      else response.status(200);

      response.set('Location', path.join(options.basePath, doc.id));

      response.json(doc);
    });
  };

  return f;
}

// Delete the addressed object
function del (options) {
  var f = function (request, response, next) {
    var id = request.params.id;
    var query = mongoose.model(options.singular).remove({ _id: id });

    if (options.restrict) options.restrict(query, request);
    populateQuery(query, request.query.populate);

    query.exec(function (error, count) {
      if (error) return next(error);
      response.json(count);
    });
  };

  return f;
}

// Retrieve documents matching conditions
function headCollection (options) {
  var f = function (request, response, next) {
    var conditions;
    var query;

    if (request.query && request.query.conditions) {
      conditions = JSON.parse(request.query.conditions);
    }

    query = mongoose.model(options.singular).find(conditions);

    if (options.restrict) options.restrict(query, request);
    populateQuery(query, request.query.populate);

    query.count(function (error, count) {
      if (error) return next(error);
      response.send(200);
    });
  };

  return f;
}

// retrieve documents matching conditions
function getCollection (options) {
  var f = function (request, response, next) {
    var firstWasProcessed = false;
    var conditions;

    if (request.query && request.query.conditions) {
      conditions = JSON.parse(request.query.conditions);
    }

    var query = mongoose.model(options.singular).find(conditions);

    if (options.restrict) options.restrict(query, request);
    populateQuery(query, request.query.populate);

    // Stream the array to the client
    response.set('Content-Type', 'application/json');
    response.write('[');

    query.stream()
      .on('data', function (doc) {
        if (firstWasProcessed) response.write(', ');
        response.write(JSON.stringify(doc.toJSON()));
        firstWasProcessed = true;
      })
      .on('error', next)
      .on('close', function () {
        response.write(']');
        response.send();
      });
  };

  return f;
}

// Create a new document and return its ID
function postCollection (options) {
  var f = function (request, response, next) {
    var body = request.body;

    // Must be object or array
    if (!body || typeof body !== 'object') {
      return next(new Error('Must supply a document or array to POST'));
    }

    response.status(201);

    // If just one object short circuit
    if (!Array.isArray(body)) {
      return mongoose.model(options.singular).create(body, function (error, doc) {
        if (error) return next(error);
        response.set('Location', path.join(options.basePath, doc.id));
        response.json(doc);
      });
    }

    // No empty arrays
    if (body.length === 0) return next(new Error('Array was empty.'));

    // Create and save given documents
    var promises = body.map(mongoose.model(options.singular).create);
    var ids = [];
    var processedCount = 0;
    var location;

    // Stream the response JSON array
    response.set('Content-Type', 'application/json');
    response.write('[');

    promises.forEach(function (promise) {
      promise.then(function (doc) {
        response.write(JSON.stringify(doc.toJSON()));

        ids.push(doc.id);

        // Still more to process?
        if (processedCount < body.length) return response.write(', ');

        // Last one was processed
        response.write(']');

        location = options.basePath + '?query={ id: { $in: [' + ids.join(',') + '] } }';
        response.set('Location', location);

        response.send();
      });

      promise.error(function (error) {
        next(new Error(error));
      });
    });

  };

  return f;
}

// Replace all docs with given docs ...
function putCollection (options) {
  var f = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  };

  return f;
}

// Delete all documents matching conditions
function delCollection (options) {
  var f = function (request, response, next) {
    var conditions = request.body || {};
    var query = mongoose.model(options.singular).remove(conditions);

    if (options.restrict) options.restrict(query, request);
    populateQuery(query, request.query.populate);

    query.exec(function (error, count) {
      if (error) return next(error);
      response.json(count);
    });
  };

  return f;
}

// Add "Link" header field, with some basic defaults
function addLinkRelations (options) {
  var f = function (request, response, next) {
    response.links({
      collection: options.basePath,
      search: options.basePath,
      edit: path.join(options.basePath, request.params.id),
      self: path.join(options.basePath, request.params.id),
      'latest-version': path.join(options.basePath, request.params.id)
    });

    next();
  };

  return f;
}

// Add "Link" header field, with some basic defaults (for collection routes)
function addLinkRelationsCollection (options) {
  var f = function (request, response, next) {
    response.links({
      search: options.basePath,
      self: options.basePath,
      'latest-version': options.basePath
    });

    next();
  };

  return f;
}

// Build the "Allow" response header
function addAllowResponseHeader (options) {
  var f = function (request, response, next) {
    var allowed = [];

    if (options.head !== false) allowed.push('HEAD');
    if (options.get  !== false) allowed.push('GET');
    if (options.post !== false) allowed.push('POST');
    if (options.put  !== false) allowed.push('PUT');
    if (options.del  !== false) allowed.push('DELETE');

    response.set('Allow', allowed.join(', '));

    next();
  };

  return f;
}

// Build the "Accept" response header
function addAcceptResponseHeader (options) {
  var f = function (request, response, next) {
    response.set('Accept', 'application/json');
    next();
  };

  return f;
}

// Validation
// ----------
// var validation = function (options) {
//   var validators = {};
//   var f = function (request, response, next) {
//     response.json(validators);
//   };

//   Object.keys(s.paths).forEach(function (path) {
//     var pathValidators = [];

//     if (path.enumValues.length > 0) {
//       // TODO
//       pathValidators.push( );
//     }

//     if (path.regExp !== null) {
//       // TODO
//       pathValidators.push( );
//     }

//     // test path.instance TODO or path.options.type

//     // TODO use any path.validators?

//     // TODO other path.options?

//     validators[path.path] = pathValidators;
//   });

//   return f;
// };

// Public Methods
// --------------
baucis.rest = function (options) {
  options || (options = {}); // TODO clone

  if (!options.singular) throw new Error('Must provide the Mongoose schema name');
  if (!options.plural) options.plural = lingo.en.pluralize(options.singular);

  var basePath = options.basePath = path.join('/', options.basePath);
  var basePathWithId = options.basePathWithId = path.join(basePath, ':id');
  var basePathWithOptionalId = options.basePathWithOptionalId = path.join(basePath, ':id?');
  var controller = express();

  controller.use(express.json());

  controller.all(basePathWithId, addAllowResponseHeader(options));
  controller.all(basePathWithId, addAcceptResponseHeader(options));
  controller.all(basePath, addAllowResponseHeader(options));
  controller.all(basePath, addAcceptResponseHeader(options));

  if (options.configure) options.configure(controller);

  if (options.relations === true) {
    controller.head(basePathWithId, addLinkRelations(options));
    controller.get(basePathWithId, addLinkRelations(options));
    controller.post(basePathWithId, addLinkRelations(options));
    controller.put(basePathWithId, addLinkRelations(options));

    controller.head(basePath, addLinkRelationsCollection(options));
    controller.get(basePath, addLinkRelationsCollection(options));
    controller.post(basePath, addLinkRelationsCollection(options));
    controller.put(basePath, addLinkRelationsCollection(options));
  }

  if (options.all) controller.all(basePathWithOptionalId, options.all);
  if (options.head) controller.head(basePathWithOptionalId, options.head);
  if (options.get) controller.get(basePathWithOptionalId, options.get);
  if (options.post) controller.post(basePathWithOptionalId, options.post);
  if (options.put) controller.put(basePathWithOptionalId, options.put);
  if (options.del) controller.del(basePathWithOptionalId, options.del);

  if (options.head !== false) controller.head(basePathWithId, head(options));
  if (options.get  !== false) controller.get(basePathWithId, get(options));
  if (options.post !== false) controller.post(basePathWithId, post(options));
  if (options.put  !== false) controller.put(basePathWithId, put(options));
  if (options.del  !== false) controller.del(basePathWithId, del(options));

  if (options.head !== false) controller.head(basePath, headCollection(options));
  if (options.get  !== false) controller.get(basePath, getCollection(options));
  if (options.post !== false) controller.post(basePath, postCollection(options));
  if (options.put  !== false) controller.put(basePath, putCollection(options));
  if (options.del  !== false) controller.del(basePath, delCollection(options));

  if (options.publish !== false) app.use(path.join('/', options.plural), controller);

  return controller;
};
