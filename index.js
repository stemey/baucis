// Dependencies
var express  = require('express');
var mongoose = require('mongoose');
var lingo    = require('lingo');

// Function to return the model for a schema
var model = function(schema) {
  var singular = schema.metadata('singular');
  if (!mongoose.models[singular]) return null;
  return mongoose.model(schema.metadata('singular'));
};

// Functions to return middleware for HTTP verbs
var get = function(schema) {
  // retrieve the addressed document
  var f = function(request, response, next) {
    var id        = request.params.id;
    var query     = model(schema).findById(id);
    var populated = schema.metadata('populate') || [];

    populated.forEach( function (field) {
      query.populate(field);
    });

    query.exec(function (err, doc) {
      if (err) return response.send(500);
      if (doc === null) return response.send(404);
      return response.json(doc);
    });
  };

  return f;
};

var post = function(schema) {
  // treat the addressed document as a collection, and push the addressed object to it
  var f = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  };

  return f;
};

var put = function (schema) {
  // replace the addressed document, or create it if nonexistant
  var f = function(request, response, next) {
    delete request.body._id; // can't send id for update, even if unchanged

    var id     = request.params.id || null;
    var create = (id === null);
    var query  = model(schema).findByIdAndUpdate(id, request.body, {upsert: true});

    query.exec( function (err, doc) {
      if (err) return next(err);

      if (create) response.status(201);
      else response.status(200);

      response.json(doc);
    });
  };

  return f;
};

var del = function (schema) {
  // delete the addressed object
  var f = function (request, response, next) {
    var id = request.params.id;
    model(schema).remove({ _id: id }).exec( function (err, count) {
      if (err) return next(err);
      response.json(count);
    });
  };

  return f;
};

var pluralGet = function (schema) {
  // retrieve documents matching conditions
  var f = function (request, response, next) {
    var conditions;

    if (request.query && request.query.query) {
      conditions = JSON.parse(request.query.query);
    }

    var query = model(schema).find(conditions);

    query.exec( function(err, docs) {
      if (err) return next(err);
      response.json(docs);
    });
  };

  return f;
};

var pluralPost = function (schema) {
  // create a new document and return its ID
  var f = function(request, response, next) {
    if (!request.body || request.body.length === 0) {
      return next(new Error('Must supply a document or array to POST'));
    }

    var Model     = model(schema);
    var newDocs   = [];
    var populated = schema.metadata('populate') || [];
    var given     = request.body;

    if (!Array.isArray(given)) given = [given];

    var docs = given.map( function(e) {
      return new Model(e);
    });

    docs.forEach( function (doc) {
      doc.save(function (err, doc) {
      	if (err) return next(err);

      	var query = Model.findById(doc._id);

      	query.exec( function (err, doc) {
      	  if (err) return next(err);
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

var pluralPut = function (schema) {
  // repalce all docs with given docs ...
  var f = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  };

  return f;
};

var pluralDel = function (schema) {
  // delete all documents matching conditions
  var f = function(request, response, next) {
    var conditions = request.body || {};
    var query = model(schema).remove(conditions);
    query.exec(function (err, count) {
      if (err) return next(err);
      response.json(count);
    });
  };

  return f;
};

// ---- Validation routes set up function ---- //
// var validation = function (schema) {
//   var validators = {};
//   var f = function(request, response, next) {
//     response.json(validators);
//   };

//   Object.keys(s.paths).forEach( function(path) {
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

module.exports = {};

module.exports.rest = function (schemata) {
  var app = express();

  if (!Array.isArray(schemata)) {
    // if array leave alone, otherwise
    if (schemata.paths) {
      // single schema -> array
      schemata = [schemata];
    }
    else {
      // hash -> array
      schemata = Object.keys(schemata).map( function (key) {
        return schemata[key];
      });
    }
  }

  schemata.forEach( function (schema) {
    if (schema.metadata('private')) return;

    var singular    = schema.metadata('singular');
    var plural      = schema.metadata('plural') || lingo.pluralize(singular);
    var singularUrl = singular + '/:id';
    var pluralUrl   = plural + '/';
    var middleware  = schema.metadata('middleware') || [];

    // Add to mongoose models if not already present
    if (!model(schema)) mongoose.model(singular, schema, plural);

//    app.head(singularUrl, middleware, head(schema)); // TODO
    app.get(singularUrl,  middleware, get(schema));
    app.post(singularUrl, middleware, post(schema));
    app.put(singularUrl,  middleware, put(schema));
    app.del(singularUrl,  middleware, del(schema));

//    app.head(pluralUrl, middleware, pluralHead(schema)); // TODO
    app.get(pluralUrl,  middleware, pluralGet(schema));
    app.post(pluralUrl, middleware, pluralPost(schema));
    app.put(pluralUrl,  middleware, pluralPut(schema));
    app.del(pluralUrl,  middleware, pluralDel(schema));
  });

  return app;
};

// This mehtod for adding metadata is added to the Schema prototype
mongoose.Schema.prototype.metadata = function (data) {
  if (!data)                             return this._metadata;
  if (data && typeof(data) === 'string') return this._metadata[data];

  if(data && typeof(data) === 'object') {
    if (this._metadata) throw new Error('Metadata was already set');
    return this._metadata = data;
  }

  throw new Error('Unrecognized use of metadata method');
};
