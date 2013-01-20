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
    },
    {
      safe: true,
      strict: true
    });

    Vegetable.metadata({
      singular: 'vegetable',
      plural: 'vegetables'
    });

    mongoose.model(Vegetable.metadata('singular'), Vegetable, Vegetable.metadata('plural'));

    app = express();
    app.configure(function(){
      app.use(express.bodyParser());
    });

    app.use('/api', baucis.rest(Vegetable));
    server = app.listen(8012);

    done();
  },
  deinit: function(done) {
    server.close();
    done();
  },
  create: function(done) {
    // clear all first
    mongoose.models['vegetable'].remove({}, function (err) {
      if (err) return done(err);

      var names = ['Turnip',   'Spinach',   'Pea',
          		     'Shitake',  'Lima Bean', 'Carrot',
                   'Zucchini', 'Radicchio'];

      vegetables = names.map( function (name) { // TODO leaked global
	      return new mongoose.models['vegetable']({ name: name });
      });

      var numberToSave = names.length;

      vegetables.forEach( function (vege) {
      	vege.save( function (err) {
      	  numberToSave--;
      	  if (err)                return done(err);
      	  if (numberToSave === 0) return done();
      	});
      });
    });
  }
};
