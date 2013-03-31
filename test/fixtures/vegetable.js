var mongoose = require('mongoose');
var express = require('express');
var baucis = require('../..');

var app;
var server;

module.exports = {
  init: function(done) {
    var Schema = mongoose.Schema;

    mongoose.connect('mongodb://localhost/xXxBaUcIsTeStXxX');

    var Vegetable = new Schema({
      name: String
    });

    baucis.rest({
      schema: Vegetable,
      singular: 'vegetable',
      all: function (request, response, next) {
        if (request.query.block === 1) return response.status(401);
        next();
      }
    });

    app = express();
    app.use('/api/v1', baucis());

    server = app.listen(8012);

    done();
  },
  deinit: function(done) {
    server.close();
    mongoose.disconnect();
    done();
  },
  create: function(done) {
    // clear all first
    mongoose.model('vegetable').remove({}, function (error) {
      if (error) return done(error);

      var names = ['Turnip',   'Spinach',   'Pea',
          		     'Shitake',  'Lima Bean', 'Carrot',
                   'Zucchini', 'Radicchio'];

      vegetables = names.map(function (name) { // TODO leaked global
	      return new (mongoose.model('vegetable'))({ name: name });
      });

      var numberToSave = names.length;

      vegetables.forEach(function (vege) {
      	vege.save(function (error) {
      	  numberToSave--;
      	  if (error) return done(error);
      	  if (numberToSave === 0) return done();
      	});
      });
    });
  }
};
