var requireindex = require('requireindex');
var expect       = require('expect.js');
var request      = require('request');

var fixtures = requireindex('./test/fixtures');
  
describe('POST plural', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);

  it('should create a new object and return its ID', function (done) {
    var options = {
      url: 'http://localhost:8012/api/vegetables/',
      json: {
	name: 'Tomato'
      }
    };
    request.post(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(id).not.to.be.empty(); // TODO check it's an ObjectID

      request.get(options, function (err, response, body) {
	if (err) return done(err);
	expect(response).to.have.property('statusCode', 200);	
	expect(body).to.have.property('name', 'Tomato');
	done();
      });
    });
  });
  
});
