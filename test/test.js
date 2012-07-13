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
  plural: 'vegetables'
});

mongoose.model(Vegetable.metadata.singular, Vegetable, Vegetable.metadata.plural);

var app = express.createServer();
app.configure(function(){
  app.use(express.bodyParser());
});

app.rest(Vegetable);
app.listen(8012);

var vegetables;
	     
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
    port: 8012,
    headers: {
      'Content-Type': 'application/json'
    }
  };
    
  var request = http.request(options, function (response) {
    var r = {
      body: '',
      response: response
    };
    
    response.setEncoding('utf8');
    
    response.on('error', function (err) {
      callback(err);
    });
    response.on('data', function (chunk) {
      r.body += chunk;
    });
    response.on('end', function () {
      callback(null, r);
    });
  });
  
  if (data !== undefined) request.write(JSON.stringify(data));
  request.end();
};

describe('REST web services', function () {
  beforeEach(function(done) {
    // clear all first
    var vegetable = mongoose.models['vegetable'];
    
    vegetable.remove({}, function (err) {
      if (err) return done(err)
      
      var names = ['Turnip', 'Spinach', 'Pea', 'Shitake', '', '', '', 'Radicchio'];
      vegetables = names.map( function (name) {
	return new vegetable({ name: name });
      });
      
      var numberToSave = names.length;
      
      vegetables.forEach( function (vege) {
	vege.save( function (err) {
	  if (err) return done(err);
	  numberToSave--;
	  if( numberToSave === 0 ) done();
	});
      });
    });
  });
  
  describe('GET singular', function () {
    it('should get the addressed document', function(done){
      var turnip = vegetables[0];
      request('GET', '/api/vegetable/' + turnip._id, function (err, r) {
	if (err) return done(err);
	
	var doc = JSON.parse(r.body);
	expect(doc._id).to.be(turnip._id.toString());
	expect(doc).to.have.property('name', 'Turnip');
	done();
      });
    });
    
    it('should return a good error', function (done) {
      request('GET', '/api/vegetable/666666666666666666666666', function (err, r) {
	if (err) return done(err);
	
	var response = r.response;
	expect(response.statusCode).to.be(404);
	done();
      }); 
    });
  });
  
  describe('POST singular', function () {
    it('should treat the given resource as a collection, and push the given object to it', function (done) {
      done(new Error('TODO: unimplemented'));
    });
  });
  
  describe('PUT singular', function () {
    it("should replace the addressed object if it exists", function (done) {
      var data = {
	name: 'Leek'
      };
      
      var radicchio = vegetables[7];
      
      // first, check it's not the leek
      request('GET', '/api/vegetable/' + radicchio._id, function (err, r) {
	if (err) return done(err);
	
	var doc = JSON.parse(r.body);
	
	expect(r.response.statusCode).to.be(200);
	expect(doc).to.have.property('name', 'Radicchio');
	
	// put the leek on the server
	request('PUT', '/api/vegetable/' + radicchio._id, data, function (err, r) {
	  if (err) return done(err);
	  
	  // check it's not Radicchio
	  request('GET', '/api/vegetable/' + radicchio._id, function (err, r) {
	    if (err) return done(err);
	    
	    var doc = JSON.parse(r.body);
	    expect(doc).to.have.property('name', 'Leek');
	    done();
	  });
	});
      });
    });
    
    it('should create the addressed document if non-existant', function (done) {
      var data = {
	name: 'Cucumber'
      };
      
      var id = 'badbadbadbadbadbadbadbad';
      
      // first check it's not there
      request('GET', '/api/vegetable/' + id, function (err, r) {
	if (err) return done(err);
	expect(r.response.statusCode).to.be(404);
	
	// put it on server
	request('PUT', '/api/vegetable/' + id, data, function (err, r) {
	  if (err) return done(err);
	  
	  expect(r.response.statusCode).to.be(200);
	  
	  // check it's there
	  request('GET', '/api/vegetable/' + id, function (err, r) {
	    if (err) return done(err);
	    
	    var doc = JSON.parse(r.body);
	    expect(doc).to.have.property('_id', id);
	    expect(doc).to.have.property('name', 'Cucumber');
	    done();
	  });
	});
      });
      
    });
  });

  describe('DEL singular', function () {
    it('should delete the addressed document', function (done) {
      
      // make sure it's there
      var shitake = vegetables[3];
      var url     = '/api/vegetable/' + shitake._id;
      
      request('GET', url, function (err, r) {
	if (err) return done(err);
	
	var doc = JSON.parse(r.body);
	expect(doc).to.have.property('name', 'Shitake');
	
	request('DELETE', url, function (err, r) {
	  if (err) return done(err);
	  
	  expect(r.response.statusCode).to.be(200);
	  
	  request('GET', url, function (err, r) {
	    if (err) return done(err);
	    
	    expect(r.response.statusCode).to.be(404);
	    done();
	  });
	});
      });
      
    });
  });
  
  describe('GET plural', function () {
    it("should return 'em all", function (done) {
      request('GET', '/api/vegetables/', function (err, r) {
	if (err) return done(err);
	
 	var docs = JSON.parse(r.body);
	expect(r.response.statusCode).to.be(200);
	docs.forEach( function(doc, i) {
	  var vege = vegetables[i];
	  expect(doc._id).to.be(vege._id.toString());
	  expect(doc.name).to.be(vege.name);
	});
	done();
      });
    });
  });
  
  describe('POST plural', function () {
    it('should create a new object and return its ID', function (done) {
      
      var data = {
	name: 'Turnip'
      };
      
      request('POST', '/api/vegetables/', data, function (err, r) {
	if (err) return done(err);
	
	var id = JSON.parse(r.body);
	expect(id).to.not.be.empty();
	
	request('GET', '/api/vegetable/' + id, function (err, r) {
	  if (err) return done(err);
	  
	  expect(r.response.statusCode).to.be(200);
	  
	  var doc = JSON.parse(r.body);
	  expect(doc).to.have.property('name', 'Turnip');
	  
	  done();
	});
      });
    });
    
  });
  
  describe('PUT plural', function () {
    it('should replace entire collection with given new collection', function (done) {
      var poke = {
	name: 'Poke'
      };
      var collards = {
	name: 'Collard Greens'
      };
      var mustard = {
	name: 'Mustard'
      };
      var newVegetables = [ poke, collards, mustard ];
      
      request('PUT', '/api/vegetables/', newVegetables, function (err, r) {
	if (err) return done(err);
	
	var ids = JSON.parse(r.body);
	expect(r.response.statusCode).to.be(200);
	expect(ids).to.have.property('length', 3); // TODO more?
	done();
      });
    });
  });
  
  describe('DEL plural', function () {
    it('should delete all documents in addressed collection', function (done) {
      request('DELETE', '/api/vegetables/', function (err, r) {
	if (err) return done(err);
	
	var count = JSON.parse(r.body);
	expect(r.response.statusCode).to.be(200);
	expect(count).to.be(8);
	done();
      });
    });
  });
  
});