var mocha    = require('mocha');
var expect   = require('expect');
var mongoose = require('mongoose');
var http     = require('http');
var baucis   = require('..');

var Schema = mongoose.Schema;

// TODO connect to a DB

var Vegetable = new Schema({
    // TODO
}, schemaOptions);

// TODO make array of vegetable docs
var vegetables = [];

// ---

var request = function (method, path, data, callback) {
    if (callback === undefined) {
	callback = data;
	data = undefined;
    }

    var options = {
	hostname: 'localhost',
	method: method,
	path: path
    };
    
    var request = http.request(options, function (response) {
	var responseData;

	response.on('error', function (err) {
	    throw err;
	});
	response.on('data', function (chunk) {
	    // TODO chucnk or buffer or something
	});
	response.on('end', function () {
	    callback(null, responseData);
	});
    });
    
    if (data !== undefined) request.write(data);
    request.end();
};

describe('REST web services', function () {
    describe('GET singular', function () {
	it('should get the addressed document', function(done){
	    request('GET', '/api/vegetable/0', function (err, doc) {
		expect(err).to.be.empty();
		expect(doc).to.equal(vegetables[0]); 
		done();
	    });
	});

	it('should return a good error', function (done) {
	    var options = httpOptions('GET', '/api/vegetable/6');
	    http.request(options, function (err, doc) {
		expect(err).to.be.('TODO');
		expect(doc).to.be.empty();
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
		expect(err).to.be.empty();
		expect(doc).to.equal('Radicchio');

		// put the leek on the server
		request('PUT', '/api/vegetable/7', data, function () {
		    expect(err).to.be.empty();
// TODO return id? //		    expect(id).to.equal(7);

		    // check it's not Radicchio
		    request('GET', '/api/vegetable/7', function (err, doc) {
			expect(err).to.be.empty();
			expect(doc).to.equal('Leek');
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
		expect(doc).to.be.empty();

		// put it on server
		request('PUT', '/api/vegetable/8', data, function () {
		    expect(err).to.be.empty();

		    // check it's there
		    request('GET', '/api/vegetable/8', function (err, doc) {
			expect(err).to.be.empty();
			expect(doc).to.be.(data);
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
		expect(err).to.be.empty();
		expect(doc).to.be.empty('Shitake');
		
		request('DEL', '/api/vegetable/8', function (err, doc) {
		    // TODO check status, etc.

		    request('GET', '/api/vegetable/8', function (err, doc) {
			expect(err).to.be('404');
			expect(doc).to.be(null);
			done();
		    });
		});
	    });

	});
    });

    describe('GET plural', function () {
	it("should return 'em all", function () {
	    request('GET', '/api/vegetables/', function (err, docs) {
		expect(err).to.be.empty();
		expect(docs).to.equal(vegetables);
		done();
	    });
	});
    });

    describe('POST plural', function () {
	it('should create a new object and return its ID', function ()
	   var data = {
	       name: 'Turnip'
	   };

	   request('POST', '/api/vegetables/', data, function (err, id) {
	       expect(err).to.be.empty();
	       expect(id).to.equal('9');
	       done();
	   });
	});

    });

    describe('PUT plural', function () {
	it('should replace entire collection with given new collection', function () {
	    var data = [ 'Poke', 'Collard Greens', 'Mustard' ];

	    // TODO should first check current state is expected
	    request('PUT', '/api/vegetables/', data, function () {
		expect(err).to.be.empty();
		expect(docs).to.equal(newVegetables);
		done();
	    });
	});
    });

    describe('DEL plural', function () {
	it('should delete all documents in addressed collection', function () {
	    // TODO check all are there first
	    request('DEL', '/api/vegetables/', function (err, docs) {
		expect(err).to.be.empty();
		expect(docs).to.equal( [] );
		done();
	    });
	});
    });

});