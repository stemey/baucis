var requireindex = require('requireindex');
var expect       = require('expect.js');
var request      = require('request');

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
    var options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: [ poke, collards, mustard ]
    };
    request.put(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(ids).to.have.property('length', 3); // TODO more...
      done();
    });
  });
});
  
