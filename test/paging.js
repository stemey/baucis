var expect = require('expect.js');
var request = require('request');

var fixtures = require('./fixtures');

describe('Paging', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should support skip 1', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/vegetables?skip=1',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('length', vegetables.length - 1);
      done();
    });
  });

  it('should support skip 2', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/vegetables?skip=2',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('length', vegetables.length - 2);
      done();
    });
  });

  it('should support limit 1', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/vegetables?limit=1',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('length', 1);
      done();
    });
  });

  it('should support limit 2', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/vegetables?limit=2',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(body).to.have.property('length', 2);
      done();
    });
  });
});
