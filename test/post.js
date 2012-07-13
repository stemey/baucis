var requireindex = require('requireindex');
var expect = require('expect.js');

var request  = require('./lib/request');
var fixtures = requireindex('./test/fixtures');

describe('POST singular', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  
  it('should treat the given resource as a collection, and push the given object to it', function (done) {
    done(new Error('TODO: unimplemented'));
  });
});