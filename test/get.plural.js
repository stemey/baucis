var requireindex = require('requireindex');
var expect       = require('expect.js');
var request      = require('request');

var fixtures = requireindex('./test/fixtures');

describe('GET plural', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  
  it("should return 'em all", function (done) {
    expect(response).to.have.property('statusCode', 200);
    var options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: true     
    };    
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      body.forEach( function(doc, i) {
	var vege = vegetables[i];
	expect(doc._id).to.be(vege._id.toString());
	expect(doc.name).to.be(vege.name);
      });
      done();
    });
  });
});
