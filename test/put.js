var requireindex = require('requireindex');
var expect = require('expect.js');

var request  = require('./lib/request');
var fixtures = requireindex('./test/fixtures');

describe('PUT singular', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);

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

