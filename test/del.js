var requireindex = require('requireindex');
var expect       = require('expect.js');
var request      = require('request');

var fixtures = requireindex('./test/fixtures');

describe('DEL singular', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);
	   
  it('should delete the addressed document', function (done) {
    // make sure it's there
    var shitake = vegetables[3];
    var options = {
      url: 'http://localhost:8012/api/vegetable/' + shitake._id,
      json: true     
    };    
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('name', 'Shitake');
      
      var options = {
	url: 'http://localhost:8012/api/vegetable/' + shitake._id,
	json: true     
      };    
      request.del(options, function (err, response, body) {
	if (err) return done(err);
        expect(response).to.have.property('statusCode', 200);
	expect(body).to.be(1); // count of deleted objects

	var options = {
	  url: 'http://localhost:8012/api/vegetable/' + shitake._id,
	  json: true     
	};    
	request.get(options, function (err, response, body) {
	  if (err) return done(err);
          expect(response).to.have.property('statusCode', 404);
	  done();
	});
      });
    });
    
  });
});