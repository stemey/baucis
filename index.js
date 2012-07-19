var express  = require('express');
var mongoose = require('mongoose');
var lingo    = require('lingo');

var BASE_URI = '/api/'; // TODO config

var model = function(schema) {
  return mongoose.models[schema.metadata('singular')];
};

var get = function(schema) {
  // retrieve the addressed document
  var r = function(request, response, next) {
    var id = request.params.id;
    model(schema).findById(id).run(function (err, doc) {
      if (err) return response.send(500); // TODO ?
      if (doc === null) return response.send(404);
      return response.json(doc);
    });
  };
  
  return r;
};

var post = function(schema) {
  // treat the addressed document as a collection, and push the addressed object to it (?)
  var r = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)	 ???
  };
  
  return r;
};

var put = function (schema) { 
  // replace the addressed document, or create it if nonexistant
  var r = function(request, response, next) {
    var id  = request.params.id || null;
    
    model(schema).update({_id: id}, request.body, {upsert: true}, function (err, doc) {
      if (err) return next(err);
      response.send(200);
    });
  };
  
  return r;
};

var del = function (schema) {
  // delete the addressed object
  var r = function (request, response, next) {
    var id = request.params.id;
    model(schema).remove({ _id: id }).run( function (err, count) {
      if (err) return next(err);
      response.json(count);
    });
  };
    
  return r;
};

var pluralGet = function (schema) {
  // retrieve documents matching conditions
  var r = function (request, response, next) {
    var conditions = request.body || {};
    var query = model(schema).find(conditions);    
    query.exec(function(err, docs) {
      if (err) return next(err);
      response.json(docs);
    });
  };

  return r;
};

var pluralPost = function (schema) {
  // create a new document and return its ID
  var r = function(request, response, next) {
    var given = request.body || [];

    if (!Array.isArray(given)) given = [given];

    var docs = given.map( function(e) { 
      return new (model(schema))(e);
    });

    var ids = [];

    docs.forEach( function (doc) {
      doc.save(function (err, doc) {
	if (err) return next(err);
	ids.push(doc._id);
	if (ids.length === docs.length) response.json(ids);
      });
    });
  };
  
  return r;
};

var pluralPut = function (schema) {
  // repalce all docs with given docs ... 
  var r = function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)	 ???
  };

  return r;
};

var pluralDel = function (schema) {
  // delete all documents matching conditions
  var r = function(request, response, next) {
    var conditions = request.body || {};
    var query = model(schema).remove(conditions);    
    query.exec(function (err, count) {
      if (err) return next(err);
      response.json(count);
    });
  };

  return r;
};

express.HTTPServer.prototype.rest =
express.HTTPSServer.prototype.rest = function (schemata) {
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

  var app = this;
  
  schemata.forEach( function (schema) {
    var singular    = schema.metadata('singular');
    var plural      = schema.metadata('plural') || lingo.pluralize(singular);
    var singularUrl = BASE_URI + singular + '/:id';
    var pluralUrl   = BASE_URI + plural + '/';
    var middleware  = schema.metadata('middleware') || [];

    // add if not already present
    if (!model(schema)) {
      mongoose.model(singular, schema, plural);
    }

    app.get(singularUrl,  middleware, get(schema));
    app.post(singularUrl, middleware, post(schema));
    app.put(singularUrl,  middleware, put(schema));
    app.del(singularUrl,  middleware, del(schema));
        
    app.get(pluralUrl,  middleware, pluralGet(schema));
    app.post(pluralUrl, middleware, pluralPost(schema));
    app.put(pluralUrl,  middleware, pluralPut(schema));
    app.del(pluralUrl,  middleware, pluralDel(schema));
  });
};
		    
mongoose.Schema.prototype.metadata = function (data) {
  if(!data)                             return this._metadata;
  if(data && typeof(data) === 'string') return this._metadata[data];

  if(data && typeof(data) === 'object') {
    if (this._metadata) throw new Error('Metadata was already set');
    return this._metadata = data;
  }

  throw new Error('Unrecognized use of metadata method');
};
