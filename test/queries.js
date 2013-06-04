var expect = require('expect.js');
var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var request = require('request');
var baucis = require('..');

var fixtures = require('./fixtures');

describe('Queries', function () {
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

  it('should disallow using +fields with populate', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/vegetables?populate={ "select": "%2Bfoo" }',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 500);
      done();
    });
  });

  it('should disallow using +fields with select', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/vegetables?select=%2Bfoo',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 500);
      done();
    });
  });

  it('should allow selecting fields', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/vegetables?select=-_id lastModified',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(body[0]).to.have.property('lastModified');
      expect(body[0]).not.to.have.property('_id');
      expect(body[0]).not.to.have.property('name');
      console.log(body)
      done();
    });
  });

});
