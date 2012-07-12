var mocha    = require('mocha');
var expect   = require('expect.js');
var mongoose = require('mongoose');
var http     = require('http');
var express  = require('express');
var baucis   = require('..');

var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/xXxBaUcIsTeStXxX'); // TODO probably check don't overwrite it ? ....

var Vegetable = new Schema({
    name: String
},
{
    safe: true,
    strict: true
});

Vegetable.metadata({
    singular: 'vegetable',
    plural: 'vegetable'
});

mongoose.model(Vegetable.metadata.singular, Vegetable, Vegetable.metadata.plural);

var app = express.createServer();
app.rest(Vegetable);
//app.use(express.errorHandler()); 
app.listen(8012);

var vegetables = (function () {
    var names = ['Turnip', 'Spinach', 'Pea'];
    var model = mongoose.models['vegetable'];

    return names.map( function (name) {
	var doc = new model({ name: name });
	doc.save();
	return doc;
    });
})();

// ---------------------------------

var request = function (method, path, data, callback) {
    if (callback === undefined) {
	callback = data;
	data = undefined;
    }

    var options = {
	hostname: '127.0.0.1',
	method: method,
	path: path,
	port: 8012
    };
    
    var request = http.request(options, function (response) {
	var responseData;

	response.setEncoding('utf8');

	response.on('error', function (err) {
	    callback(err);
	});
	response.on('data', function (chunk) {
	    console.log('chunk: ' + chunk);
	    responseData += chunk;
	});
	response.on('end', function () {
	    callback(null, responseData);
	});
    });
    
    if (data !== undefined) request.write(data);
    request.end();
};

describe('REST web services', function () {
    // TODO knowck down / build up
    describe('GET singular', function () {
	it('should get the addressed document', function(done){
	    var turnip = vegetables[0]; // TODO convert to hash
	    request('GET', '/api/vegetable/' + turnip._id, function (err, doc) {
		expect(err).to.be(null);
		expect(doc).to.be(vegetables[0]); 
		done();
	    });
	});

	it('should return a good error', function (done) {
	    var options = httpOptions('GET', '/api/vegetable/6');
	    request('GET', '/api/vegetable/6', function (err, doc) {
		expect(err).to.be(404);
		expect(doc).to.be(undefined);
		done();
	    }); 
	});
    });

    describe('POST singular', function () {
	it('should treat the given resource as a collection, and push the given object to it', function () {
	    // TODO unimplemented
	    done();
	});
    });

    describe('PUT singular', function () {
	it("should replace the addressed object if it doesn't exist", function () {
	    var data = {
		name: 'Leek'
	    };

	    // first, check it's not the leek
	    request('GET', '/api/vegetable/7', function (err, doc) {
		expect(err).to.be(undefined);
		expect(doc).to.be('Radicchio');

		// put the leek on the server
		request('PUT', '/api/vegetable/7', data, function () {
		    expect(err).to.be(undefined);
// TODO return id? //		    expect(id).to.be(7);

		    // check it's not Radicchio
		    request('GET', '/api/vegetable/7', function (err, doc) {
			expect(err).to.be(undefined);
			expect(doc).to.be('Leek');
			done();
		    });
		});
	    });
	});
	
	it('should create the addressed document if non-existant', function () {
	    var data = {
		name: 'Cucumber'
	    };

	    // first check it's not there
	    request('GET', '/api/vegetable/8', function (err, doc) {
		expect(err).to.be('404');
		expect(doc).to.be(undefined);

		// put it on server
		request('PUT', '/api/vegetable/8', data, function () {
		    expect(err).to.be(undefined);

		    // check it's there
		    request('GET', '/api/vegetable/8', function (err, doc) {
			expect(err).to.be(undefined);
			expect(doc).to.be(data);
			done();
		    });
		});
	    });

	});
    });

    describe('DEL singular', function () {
	it('should delete the addressed document', function () {
	    		    
	    // make sure it's there
	    request('GET', '/api/vegetable/8', function (err, doc) {
		expect(err).to.be(undefined);
		expect(doc).to.be('Shitake');
		
		request('DEL', '/api/vegetable/8', function (err, doc) {
		    // TODO check status, etc.

		    request('GET', '/api/vegetable/8', function (err, doc) {
			expect(err).to.be('404');
			expect(doc).to.be(undefined);
			done();
		    });
		});
	    });

	});
    });

    describe('GET plural', function () {
	it("should return 'em all", function () {
	    request('GET', '/api/vegetables/', function (err, docs) {
		expect(err).to.be(undefined);
		expect(docs).to.be(vegetables);
		done();
	    });
	});
    });

    describe('POST plural', function () {
	it('should create a new object and return its ID', function () {
	       
	   var data = {
	       name: 'Turnip'
	   };

	   request('POST', '/api/vegetables/', data, function (err, id) {
	       expect(err).to.be(undefined);
	       expect(id).to.be(9);
	       done();
	   });
	});

    });

    describe('PUT plural', function () {
	it('should replace entire collection with given new collection', function () {
	    var data = [ 'Poke', 'Collard Greens', 'Mustard' ];

	    // TODO should first check current state is expected
	    request('PUT', '/api/vegetables/', data, function () {
		expect(err).to.be(undefined);
		expect(docs).to.be(newVegetables);
		done();
	    });
	});
    });

    describe('DEL plural', function () {
	it('should delete all documents in addressed collection', function () {
	    // TODO check all are there first
	    request('DEL', '/api/vegetables/', function (err, docs) {
		expect(err).to.be(undefined);
		expect(docs).to.be.empty();
		done();
	    });
	});
    });

});