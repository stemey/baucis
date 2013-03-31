// Dependencies
// ------------
var express = require('express');
var mongoose = require('mongoose');
var lingo = require('lingo');

// Module Definition
// -----------------
var baucis = module.exports = function (options) {
  options || (options = {});

  var app = baucis.app = express();

  app.set('urlPrefix', options.urlPrefix || '/api');
  app.set('version', options.version || 1);

  app.use(express.bodyParser());

  return app;
};

// Private Functions
// -----------------
function generateUrlFor (plural) {
  var app = baucis.app;
  return app.get('urlPrefix') + '/' + app.get('version') + '/' + plural;
};

// Middleware
// ----------
// Functions to return middleware for HTTP verbs

// Retrieve header for the addressed document
var head = function (options) {
  var f = function (request, response, next) {
    var id = request.params.id;
    var query = mongoose.model(options.singular).findById(id);

    query.count(function (error, count) {
      if (error) return next(error);
      if (count === 0) return response.send(404);
      response.send(200);
    });
  };

  return f;
};

// Retrieve the addressed document
var get = function (options) {
  var f = function (request, response, next) {
    var id = request.params.id;
    var query = mongoose.model(options.singular).findById(id);

    query.exec(function (error, doc) {
      if (error) return next(error);
      if (!doc) return response.send(404);
      response.json(doc);
    });
  };

  return f;
};

// Treat the addressed document as a collection, and push
// the addressed object to it
var post = function (options) {
  var f = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  };

  return f;
};

// Replace the addressed document, or create it if it doesn't exist
var put = function (options) {
  var f = function (request, response, next) {
    // Can't send id for update, even if unchanged
    delete request.body._id;

    var id = request.params.id || null;
    var create = (id === null);
    var query = mongoose.model(options.singular).findByIdAndUpdate(id, request.body, {upsert: true});

    query.exec(function (error, doc) {
      if (error) return next(error);

      if (create) response.status(201);
      else response.status(200);

      response.json(doc);
    });
  };

  return f;
};

// Delete the addressed object
var del = function (options) {
  var f = function (request, response, next) {
    var id = request.params.id;
    mongoose.model(options.singular).remove({ _id: id }).exec(function (error, count) {
      if (error) return next(error);
      response.json(count);
    });
  };

  return f;
};

// Retrieve documents matching conditions
var headCollection = function (options) {
  var f = function (request, response, next) {
    var conditions;
    var query;

    if (request.query && request.query.query) {
      conditions = JSON.parse(request.query.query);
    }

    query = mongoose.model(options.singular).find(conditions);
    query.count(function (error, count) {
      if (error) return next(error);
      response.send(200);
    });
  };

  return f;
};

// retrieve documents matching conditions
var getCollection = function (options) {
  var f = function (request, response, next) {
    var conditions;
    var query;

    if (request.query && request.query.query) {
      conditions = JSON.parse(request.query.query);
    }

    query = mongoose.model(options.singular).find(conditions);
    query.exec(function (error, docs) {
      if (error) return next(error);
      response.json(docs);
    });
  };

  return f;
};

var postCollection = function (options) {
  // create a new document and return its ID
  var f = function (request, response, next) {
    if (!request.body || request.body.length === 0) {
      return next(new Error('Must supply a document or array to POST'));
    }

    var Model = mongoose.model(options.singular);
    var newDocs = [];
    var given = request.body;

    if (!Array.isArray(given)) given = [given];

    var docs = given.map(function (doc) {
      return new Model(doc);
    });

    docs.forEach(function (doc) {
      doc.save(function (error, doc) {
      	if (error) return next(error);

      	var query = Model.findById(doc._id);

      	query.exec(function (error, doc) {
      	  if (error) return next(error);
      	  newDocs.push(doc);

      	  if (newDocs.length === docs.length) {
      	    response.status(201);
      	    if (docs.length === 1) return response.json(docs[0]);
      	    else return response.json(docs);
      	  }
      	});
      });
    });
  };

  return f;
};

var putCollection = function (options) {
  // replace all docs with given docs ...
  var f = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  };

  return f;
};

var delCollection = function (options) {
  // delete all documents matching conditions
  var f = function (request, response, next) {
    var conditions = request.body || {};
    var query = mongoose.model(options.singular).remove(conditions);
    query.exec(function (error, count) {
      if (error) return next(error);
      response.json(count);
    });
  };

  return f;
};

// ---- Validation routes set up function ---- //
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

baucis.rest = function (options) {
  options || (options = {});

  if (options.private) return null;
  if (!options.schema) throw new Error('Must supply a schema')

  if (!options.plural) options.plural = lingo.pluralize(singular);

  var app = baucis.app;
  var middleware = options.middleware || [];
  var url = generateUrlFor(options.plural);

  // Add to mongoose models if not already present
  if (!mongoose.models[options.singular]) {
    mongoose.model(options.singular, options.schema, options.plural);
  }

  app.head(url + '/:id', middleware, head(options));
  app.get(url + '/:id', middleware, get(options));
  app.post(url + '/:id', middleware, post(options));
  app.put(url + '/:id', middleware, put(options));
  app.del(url + '/:id', middleware, del(options));

  app.head(url, middleware, headCollection(options));
  app.get(url, middleware, getCollection(options));
  app.post(url, middleware, postCollection(options));
  app.put(url, middleware, putCollection(options));
  app.del(url, middleware, delCollection(options));

  return url;
};
