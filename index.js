// Dependencies
// ------------
// Dependencies
// ------------
var express = require('express');
var mongoose = require('mongoose');
var lingo = require('lingo');

// Private Members
// ---------------
var app = express();

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
var head = function (options) {
  var f = function (request, response, next) {
    var id = request.params.id;
    var query = mongoose.model(options.singular).findById(id);

    if (options.restrict) options.restrict(query);

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

    if (options.restrict) options.restrict(query);

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

    if (options.restrict) options.restrict(query);

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
    var query = mongoose.model(options.singular).remove({ _id: id });

    if (options.restrict) options.restrict(query);

    query.exec(function (error, count) {
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

    if (options.restrict) options.restrict(query);

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

    if (options.restrict) options.restrict(query);

    query.exec(function (error, docs) {
      if (error) return next(error);
      response.json(docs);
    });
  };

  return f;
};

// Create a new document and return its ID
var postCollection = function (options) {
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

        if (options.restrict) options.restrict(query);

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

// Replace all docs with given docs ...
var putCollection = function (options) {
  var f = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  };

  return f;
};

// Delete all documents matching conditions
var delCollection = function (options) {
  var f = function (request, response, next) {
    var conditions = request.body || {};
    var query = mongoose.model(options.singular).remove(conditions);

    if (options.restrict) options.restrict(query);

    query.exec(function (error, count) {
      if (error) return next(error);
      response.json(count);
    });
  };

  return f;
};

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

  var controller = express();

  controller.use(express.bodyParser());

  if (options.all) controller.all('/:id?', options.all);
  if (options.head) controller.head('/:id?', options.head);
  if (options.get) controller.get('/:id?', options.get);
  if (options.post) controller.post('/:id?', options.post);
  if (options.put) controller.put('/:id?', options.put);
  if (options.del) controller.del('/:id?', options.del);

  if (options.head !== false) controller.head('/:id', head(options));
  if (options.get  !== false) controller.get('/:id', get(options));
  if (options.post !== false) controller.post('/:id', post(options));
  if (options.put  !== false) controller.put('/:id', put(options));
  if (options.del  !== false) controller.del('/:id', del(options));

  if (options.head !== false) controller.head('/', headCollection(options));
  if (options.get  !== false) controller.get('/', getCollection(options));
  if (options.post !== false) controller.post('/', postCollection(options));
  if (options.put  !== false) controller.put('/', putCollection(options));
  if (options.del  !== false) controller.del('/', delCollection(options));

  if (options.publish !== false) app.use('/' + options.plural, controller);

  return controller;
};
