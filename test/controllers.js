var expect = require('expect.js');
var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var request = require('request');
var baucis = require('..');

var fixtures = require('./fixtures');

describe('Controllers', function () {
  before(fixtures.controller.init);
  beforeEach(fixtures.controller.create);
  after(fixtures.controller.deinit);

  it('should allow passing string name only to create', function (done) {
    var makeController = function () { baucis.rest('store') };
    expect(makeController).to.not.throwException();
    done();
  });

  it('should support select options', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/cheeses',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('length', 3);
      expect(body[0]).to.have.property('color', 'Yellow');
      expect(body[0]).to.have.property('name', 'Cheddar');
      expect(body[0]).not.to.have.property('_id');
      done();
    });
  });

  it('should support finding documents with custom findBy field', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/cheeses/Camembert',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('color', 'White');
      done();
    });
  });

  it('should disallow adding a non-unique findBy field', function (done) {
    var makeController = function () {
      baucis.rest({ singular: 'cheese', findBy: 'color' });
    };
    expect(makeController).to.throwException();
    done();
  });

  it('should allow adding arbitrary routes', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores/info',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.be('OK!');
      done();
    });
  });

  it('should allow adding arbitrary routes with params', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores/XYZ/arbitrary',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.be('XYZ');
      done();
    });
  });

  it('should still allow using baucis routes when adding arbitrary routes', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores',
      qs: { select: 'name -_id' },
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.eql([ { name: 'Westlake' }, { name: 'Corner' } ]);
      done();
    });
  });

  it('should allow mounting of subcontrollers', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores/123/tools',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      done();
    });
  });

  it('should allow using middleware', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores',
      json: true
    };
    request.del(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(response.headers['x-poncho']).to.be('Poncho!');
      done();
    });
  });

  it('should allow using middleware mounted at a path', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores/binfo',
      json: true
    };
    request.post(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(body).to.be('Poncho!');
      done();
    });
  });

  it('should disallow adding handlers after initialization', function (done) {
    var controller = baucis.rest('store');
    controller.initialize();
    var register = function () { controller.request('get', function () {}) };
    expect(register).to.throwException();
    done();
  });

  it('should not allow query middleware to be explicitly registered for POST', function (done) {
    var controller = baucis.rest('store');
    var register = function () { controller.query('get put head del post', function () {}) };
    expect(register).to.throwException();
    done();
  });

  it('should ignore implicitly registered query middleware for POST', function (done) {
    var controller = baucis.rest('store');
    var register = function () { controller.query(function () {}) };
    expect(register).not.to.throwException();
    done();
  });

  it('should allow registering query middleware for other verbs', function (done) {
    var controller = baucis.rest('store');
    var register = function () { controller.query('get put head del', function () {}) };
    expect(register).not.to.throwException();
    done();
  });

  it('should allow registering POST middleware for other stages', function (done) {
    var controller = baucis.rest('store');
    var register = function () {
      controller.request('post', function () {});
      controller.documents('post', function () {});
    };

    expect(register).not.to.throwException();
    done();
  });

});
