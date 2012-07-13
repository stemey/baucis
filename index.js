var express  = require('express');
var mongoose = require('mongoose');

var BASE_URI = '/api/'; // TODO config

var model = function(schema) {
  return mongoose.models[schema.metadata.singular];
};

var get = function(schema) {
  // return the spcefied resource
  var r = function(request, response, next) {
    var id = request.params.id;
    model(schema).findById(id).run(function (err, doc) {
      if (err) return done(err);
      if (doc === null) return response.send(404);
      response.json(doc);
    });
  };
  
  return r;
};

var post = function(schema) {
  // treat the given resource as a collection, and push the given object to it
  var r = function (request, response, next) {
    // TODO should check if certain metadata is set and perform accordingly
    response.send(405); // method not allowed (as of yet unimplemented)	 ???
  };
  
  return r;
};

var put = function (schema) { 
  // replace given object, or create it if nonexistant
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
  // TODO take range params, etc.
  var r = function (request, response, next) {
    var query = request.query || {}; // TODO validate? // get from JSON or queryStr
    model(schema).find(query, function(err, docs) {
      if (err) return next(err);
      response.json(docs);
    });
  };

  return r;
};

var pluralPost = function (schema) {
  // create a new object and return its ID
  var r = function(request, response, next) {
    var o = new (model(schema))(request.body);
    o.save(function (err, doc) {
      if (err) return next(err);
      response.json(doc._id);
    });
  };
  
  return r;
};

var pluralPut = function (schema) {
  // replace entire collection with given new collection and return IDs
  var r = function(request, response, next) {
    model(schema).remove({}, function (err, foo) {
      if (err) return next(err);
      
      // TODO make sure is array (or marshal) and respond accordingly
      var docs = request.body
      var ids = [];
      var numSaved = 0;
      
      docs.forEach( function (data, i) { // TODO use some async lib here
	var doc = new (model(schema))(data);
	
	doc.save( function (err, doc) {
	  if (err) return next(err);
	  ids[i] = doc._id;
	  numSaved++;
	  if(numSaved === docs.length) response.json(ids);
	});
      });
    });
  };

  return r;
};

var pluralDel = function (schema) {
  // delete entire collection  
  var r = function(request, response, next) {
    model(schema).remove({}, function (err, count) {
      if (err) return next(err);
      response.json(count);
    });
  };

  return r;
};

express.HTTPServer.prototype.rest =
express.HTTPSServer.prototype.rest = function (schemata) {
  
  var t;

  if (schemata === 'Object') {
    t = [];
    for (key in schemata) {
      if (!schemata.hasOwnProperty(key)) continue;
      t.push(schemata[key]);
    }
    schemata = t;
  }
  else if (schemata !== 'Array') {
    schemata = [schemata];
  }

  var that = this;
  
  schemata.forEach( function (schema) {
    var metadata   = schema.metadata;
    var middleware = metadata.middleware || [];
    var singular   = BASE_URI + metadata.singular;
    var plural     = BASE_URI + (metadata.plural || metadata.singular + 's');
    
    // add if not already present
    if (!model(schema)) {
      mongoose.model(schema.metadata.singular, schema, schema.metadata.plural);
    }
    
    that.get(singular + '/:id', middleware, get(schema));
    that.post(singular,         middleware, post(schema));
    that.put(singular + '/:id', middleware, put(schema));
    that.del(singular + '/:id', middleware, del(schema));
    
    that.get(plural,  middleware, pluralGet(schema));
    that.post(plural, middleware, pluralPost(schema));
    that.put(plural,  middleware, pluralPut(schema));
    that.del(plural,  middleware, pluralDel(schema));
  });
};
		    
mongoose.Schema.prototype.metadata = function (data) { // TODO make this cool and test
  this.metadata = data;
};
		    