var requireindex = require('requireindex');
var expect = require('expect.js');

var request  = require('./lib/request');
var fixtures = requireindex('./test/fixtures');

describe('GET singular', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);

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
  
  it('should return a 404 when ID not found', function (done) {
    request('GET', '/api/vegetable/666666666666666666666666', function (err, r) {
      if (err) return done(err);
      
      var response = r.response;
      expect(response.statusCode).to.be(404);
      done();
    }); 
  });

  it('should return a 500 when ID malformed (not ObjectID)', function (done) {
    request('GET', '/api/vegetable/6', function (err, r) {
      if (err) return done(err);
      
      var response = r.response;
      expect(response.statusCode).to.be(500);
      done();
    }); 
  });

});
