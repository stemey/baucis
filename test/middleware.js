var requireindex  = require('requireindex');
var expect        = require('expect.js');
var mongoose      = require('mongoose');
var express       = require('express');
var passport      = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var request       = require('request');
var baucis        = require('..');

var fixtures = requireindex('./test/fixtures');

describe('Middleware', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should prevent resource from being loaded when querystring is set', function (done) {
    var options = {
      url : 'http://localhost:8012/api/vegetable/' + vegetables[0]._id,
      qs  : { block: 1 },
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(401);
      done();
    });
  });

  it('should allow resource to be loaded when querystring is not set', function (done) {
    var options = {
      url : 'http://localhost:8012/api/vegetable/' + vegetables[0]._id,
      qs  : { block: 0 },
      json: true
    };

    request.get(options, function (err, response, body) {
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('name', 'Turnip');

      done();
    });
  });

});
