var express  = require('express');
var mongoose = require('mongoose');

var rest = {};
var BASE_URI = '/api/'; // TODO config

var model = function(schema) {
    return mongoose.models[schema.metadata.singular];
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
    var r = function (request, response, next) {
	// TODO should check if certain metadata is set and perform accordingly
	response.send(405); // method not allowed (as of yet unimplemented)	
    };
};

var put = function (schema) { 
    // replace given object, or create it if nonexistant
    var r = function(request, response, next) {
	var id = request.params.id || null;
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

var addRoutes = function (schema) {

};

express.HTTPServer.prototype.rest =
express.HTTPSServer.prototype.rest = function (scheme) {
    var schema;

    if (scheme === 'Array') {
	schema = scheme;
    }
    else if (scheme === 'Object') {
	schema = [];
	for (key in scheme) {
	    if (!scheme.hasOwnProperty(key)) continue;
	    schema.push(scheme[key]);
	}
    }
    else {
	schema = [scheme];
    }

    var that = this; // TODO

    schema.forEach( function (scheme) { // TODO name reuse :(
	var metadata   = scheme.metadata;
	var middleware = metadata.middleware || []; // TODO
	var singular   = BASE_URI + metadata.singular;
	var plural     = BASE_URI + (metadata.plural || metadata.singular + 's');
	
	that.get(singular + '/:id', middleware, get(scheme));
	that.post(singular,         middleware, post(scheme));
	that.put(singular + '/:id', middleware, put(scheme));
	that.del(singular + '/:id', middleware, del(scheme));
	
	that.get(plural,  middleware, multiGet(scheme));
	that.post(plural, middleware, multiPost(scheme));
	that.put(plural,  middleware, multiPut(scheme));
	that.del(plural,  middleware, multiPut(scheme));
    });
};
		    
mongoose.Schema.prototype.metadata = function (data) {
    this.metadata = data;
};
		    