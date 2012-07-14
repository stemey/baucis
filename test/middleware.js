var requireindex  = require('requireindex');
var expect        = require('expect.js');
var mongoose      = require('mongoose');
var express       = require('express');
var passport      = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var request       = require('request');

var fixtures = requireindex('./test/fixtures');

describe('Middleware', function () {
  before(function (done) { // TODO break these out into separate functions and get them to run sequentially (e.g. makeDb, make vege, make app, etc.)
    var Schema = mongoose.Schema;

    mongoose.connect('mongodb://localhost/xXxBaUcIsTeStXxX');

    var Vegetable = new Schema({
      name: String
    },
    {
      safe: true,
      strict: true
    });

    Vegetable.metadata({
      singular: 'vegetable',
      plural: 'vegetables',
      middleware: function(request, response, next) { // plain old Connect middleware!
	if (request.isAuthenticated()) return next();
	else return response.send(401);
      }
    });

    mongoose.model(Vegetable.metadata('singular'), Vegetable, Vegetable.metadata('plural'));
    
    var app = express.createServer();
    app.configure(function(){
      app.use(express.cookieParser());
      app.use(express.bodyParser());
      app.use(express.session({ secret: 'bass raccoon' }));
      app.use(express.methodOverride());
      app.use(passport.initialize());
      app.use(passport.session());
    });

    passport.serializeUser(function(user, done) {
      done(null, user.name);
    });

    passport.deserializeUser(function(name, done) {
      done(null, { name: name });
    });

    passport.use(new LocalStrategy(
      function(username, password, done) {
	var user = (username === 'ok') ? { name: 'ok' } : false;
        if (!user) return done(null, false, { message: 'Unknown user ' + username });
        return done(null, user);
      }
    ));

    app.post('/api/login', function(request, response, next) {
      passport.authenticate('local', function(err) {
	if (err) return next(err);

	var username = request.body.username;
	var user     = { name: username };

	if (username !== 'ok') return response.send(401);

	request.logIn(user, function(err) {
	  if (err) return next(err);
	  return response.send(200);
	});
      })(request, response, next);
    });

    app.rest(Vegetable);
    app.listen(8012);

    done();
  });

  beforeEach(fixtures.vegetable.create);

  describe('passport and middleware', function () {

    it('should prevent resource from being loaded when not logged in', function (done) {
      var options = {
	url: 'http://localhost:8012/api/vegetable/' + vegetables[0]._id,
	json:true
      }; 
      request.get(options, function (err, response, body) {
	if (err) return done(err);
	expect(response.statusCode).to.be(401);
	done();
      });
    });

    it('should prevent resource to be loaded with wrong credentials', function (done) {
      var options = {
	url: 'http://localhost:8012/api/login',
	json: {
	  username: 'dude'
	}
      }; 
      request.post(options, function (err, response, body) {
    	if (err) return done(err);
    	expect(response.statusCode).to.be(401);

	var options = {
	  url: 'http://localhost:8012/api/vegetable/' + vegetables[0]._id,
	  json: true
	}; 

    	request.get(options, function (err, response, body) {
    	  if (err) return done(err);
    	  expect(response.statusCode).to.be(401);
    	  done();
    	});
      });
    });

    it('should allow resource to be loaded with correct credentials', function (done) {
      var options = {
	url: 'http://localhost:8012/api/login',
	json: {
	  username: 'ok'
	}
      }; 
      request.post(options, function (err, response, body) {
    	if (err) return done(err);
    	expect(response.statusCode).to.be(200);

	var options = {
	  url: 'http://localhost:8012/api/vegetable/' + vegetables[0]._id,
	  json: true
	}; 

    	request.get(options, function (err, response, body) {
    	  if (err) return done(err);

    	  expect(response.statusCode).to.be(200);
    	  expect(body).to.have.property('name', 'Turnip');
	  
    	  done();
    	});
      });
    });

  });
});