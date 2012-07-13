var requireindex = require('requireindex');
var expect = require('expect.js');

var request  = require('./lib/request');
var fixtures = requireindex('./test/fixtures');

describe('GET plural', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  

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
