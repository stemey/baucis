var expect = require('expect.js');
var request = require('request');

var fixtures = require('./fixtures');

describe('POST plural', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should create a new object and return its ID', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/vegetables/',
      json: {
	      name: 'Tomato'
      }
    };
    request.post(options, function (error, response, body) {
      if (error) return done(error);
      var id = body._id;
      expect(response.statusCode).to.equal(201);
      expect(id).not.to.be.empty(); // TODO check it's an ObjectID

      var options = {
      	url: 'http://localhost:8012/api/v1/vegetables/' + id,
      	json: true
      };
      request.get(options, function (error, response, body) {
      	if (error) return done(error);
      	expect(response).to.have.property('statusCode', 200);
      	expect(body).to.have.property('name', 'Tomato');
      	done();
      });
    });
  });

});
