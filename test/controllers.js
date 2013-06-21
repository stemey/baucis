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

  it('should allow adding arbitrary routes', function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores/info',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(response.body).to.be('OK!');
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

  it('should allow using middleware' /*, function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response).to.have.property('statusCode', 200);
      expect(response).to.have.property('body', 'Poncho!');
      done();
    });
  }*/);


  it('should allow using middleware mounted at a path'/*,  function (done) {
    var options = {
      url: 'http://localhost:8012/api/v1/stores/binfo',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(response.body).to.be('OK!');
      done();
    });
  } */);

  it('should disallow adding handlers after initialization', function (done) {
    var f = function () { controller.request('get', function () {}) };
    expect(f).to.throwException();
    done();
  });

});
