var express  = require('express');
var mongoose = require('mongoose');

var rest = {};
var BASE_URI = '/api/';

var get = function(model) {
    // return the spcefied resource
    var r = function(request, response, next) {
	console.log(model);

	var id    = request.params.id;
	var query = mongoose.models[model.statics.metadata.singular].findOne({ _id: id });

	query.run( function (err, o) {
	    if (err) return next(err);
	    response.json(o);
	});
    };

    return r;
};

var post = function(model) {
    // treat the given resource as a collection, and push the given object to it
};

var put = function (model) { 
    // replace given object, or create it if nonexistant
    var r = function(request, response, next) {
	var id = request.params.id;
	// update
    };
    
    return r;
};

var del = function (model) {
    // delete the addressed object
    var r = function (request, response, next) {
	var id = request.params.id;
	// delete
    };
    
    return r;
};

var multiGet = function (model) {
    // TODO take range params, etc.
    var r = function (request, response, next) {
	mongoose.models[model.statics.metadata.singular].find().run( function(err, os) {
	    if (err) next(err);
	    response.json(os);
	});
    };

    return r;
};

var multiPost = function (model) {
    // create a new object
    // return it's ID or whole object
    var r = function(request, response, next) {
	var o = new model(request.payload); // TODO or something
	model.save(o, function (err) {
	    if (err) next (err);
	});
    };

    return r;
};

var multiPut = function (model) {
    // replace entire collection with given new collection
};

var multiDel = function (model) {
    // delete entire collection  
};

express.HTTPServer.prototype.rest =
express.HTTPSServer.prototype.rest = function (model) {
    var metadata   = model.statics.metadata;
    var middleware = metadata.middleware || []; // TODO
    var singular   = BASE_URI + metadata.singular;
    var plural     = BASE_URI + (metadata.plural || model.singular + 's');

    this.get(singular + '/:id', middleware, get(model));
    this.post(singular,         middleware, post(model));
    this.put(singular + '/:id', middleware, put(model));
    this.del(singular + '/:id', middleware, del(model));

    this.get(plural,  middleware, multiGet(model));
    this.post(plural, middleware, multiPost(model));
    this.put(plural,  middleware, multiPut(model));
    this.del(plural,  middleware, multiPut(model));
};

// TODO could also modify mongoose.Schema with
//    prototype.metadata() to get and metadata({}) to set?