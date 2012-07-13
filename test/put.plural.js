var requireindex = require('requireindex');
var expect = require('expect.js');

var request  = require('./lib/request');
var fixtures = requireindex('./test/fixtures');
  
describe('PUT plural', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);

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
  
