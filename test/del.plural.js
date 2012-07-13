var requireindex = require('requireindex');
var expect = require('expect.js');

var request  = require('./lib/request');
var fixtures = requireindex('./test/fixtures');

describe('DEL plural', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);

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
