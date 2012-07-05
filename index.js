var express  = require('express');
var mongoose = require('mongoose');

var rest = {};
var BASE_URI = '/api/';

var model = function(schema) {
    return mongoose.models[schema.statics.metadata.singular];
};

var get = function(schema) {
    // return the spcefied resource
    var r = function(request, response, next) {
	var id = request.params.id;
	model(schema).findById(id).run( function (err, doc) {
	    if (err) return next(err);
	    response.json(o); // TODO return?
	});
    };

    return r;
};

var post = function(schema) {
    // treat the given resource as a collection, and push the given object to it
};

var put = function (schema) { 
    // replace given object, or create it if nonexistant
    var r = function(request, response, next) {
	var id = request.params.id || null; // TODO test this
	var o = new schema(request.payload); // TODO
	o.save();
    };
    
    return r;
};

var del = function (schema) {
    // delete the addressed object
    var r = function (request, response, next) {
	var id = request.params.id;
	model(schema).remove({ _id: id }, function (err, foo) {
	    if (err) return next(err);
	    console.log(foo);
	    response.json(true);
	});
    };
    
    return r;
};

var multiGet = function (schema) {
    // TODO take range params, etc.
    var r = function (request, response, next) {
	var query = request.query || {}; // TODO validate?
	model(schema).find(query).run( function(err, os) {
	    if (err) next(err);
	    response.json(os); // TODO return?
	});
    };

    return r;
};

var multiPost = function (schema) {
    // create a new object
    // return it's ID
    var r = function(request, response, next) {
	var o = new schema(request.payload); // TODO or something
	o.save(function (err, o) {
	    if (err) next (err);
	    response.json(o._id);
	});
    };

    return r;
};

var multiPut = function (schema) {
    // replace entire collection with given new collection
    model(schema).remove({}, function (err, foo) {
	if (err) return next(err);
	console.log(foo);
	// TODO return ?

	// TODO add passed in docs
    });
};

var multiDel = function (schema) {
    // delete entire collection  
    model(schema).remove({}, function (err, foo) {
	if (err) return next(err);
	console.log(foo);
	// TODO return ?
    });
};

express.HTTPServer.prototype.rest =
express.HTTPSServer.prototype.rest = function (schema) {
    var metadata   = schema.statics.metadata;
    var middleware = metadata.middleware || []; // TODO
    var singular   = BASE_URI + metadata.singular;
    var plural     = BASE_URI + (metadata.plural || schema.singular + 's');

    this.get(singular + '/:id', middleware, get(schema));
    this.post(singular,         middleware, post(schema));
    this.put(singular + '/:id', middleware, put(schema));
    this.del(singular + '/:id', middleware, del(schema));

    this.get(plural,  middleware, multiGet(schema));
    this.post(plural, middleware, multiPost(schema));
    this.put(plural,  middleware, multiPut(schema));
    this.del(plural,  middleware, multiPut(schema));
};

// TODO could also modify mongoose.Schema with
//    prototype.metadata() to get and metadata({}) to set?