var express  = require('express');
var mongoose = require('mongoose');

var rest = {};

var get = function(model) {
    var r = function(request, response, next) {
	console.log(model);

	var id    = request.params.id;
	var query = mongoose.models[model.modelName].findOne({ _id: id });

	query.run( function (err, o) {
	    if (err) return next(err);
	    response.json(o);
	});
    };

    return r;
};

var post = function (model) {
    var r = function(request, response, next) {
	var o = new model.schema(request.payload); // TODO or something
	model.save(o, function (err) {
	    if (err) next (err);
	});
    };

    return r;
};

var put = function (model) { 
    var r = function(request, response, next) {
	var id = request.params.id;
	// update
    };
    
    return r;
};

var del = function (model) {
    var r = function (request, response, next) {
	var id = request.params.id;
	// delete
    };
    
    return r;
};

var multiGet = function (model) {
    // TODO take range params, etc.
    var r = function (request, response, next) {
	mongoose.models[model.modelName].find().run( function(err, os) {
	    if (err) next(err);
	    response.json(os);
	});
    };

    return r;
};

express.HTTPServer.prototype.rest =
express.HTTPSServer.prototype.rest = function (model) {
    // TODO define meta-config for models, especially for setting up next() calls for 
    // permissions, etc.

    var middleware = []; // TODO

    console.log(model);
    // TODO
    // var singular = model.name;
    // var plural = model.plural || model.name + 's';

    var singular = '/api/' + model.collectionName; // tODO

    this.get(singular + '/:id', middleware, get(model)); // read
    this.post(singular,         middleware, post(model)); // create
    this.put(singular + '/:id', middleware, put(model)); // update
    this.del(singular + '/:id', middleware, del(model)); // destroy

//    app.get(singular, multiGet(model));
//    app.get(plural, multiGet(model)); // TODO support queries
    // app.del(plural, delMulti(model)); // TODO maybe...
    // TODO security
    // TODO base URL e.g. /api/post/15
};
