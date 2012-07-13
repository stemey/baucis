var mongoose = require('mongoose');
var express = require('express');
var baucis = require('../..');

module.exports = {
  init: function(done) {
    var Schema = mongoose.Schema;

    mongoose.connect('mongodb://localhost/xXxBaUcIsTeStXxX'); // TODO probably check don't overwrite it ? ....

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

    mongoose.model(Vegetable.metadata.singular, Vegetable, Vegetable.metadata.plural);
    
    var app = express.createServer();
    app.configure(function(){
      app.use(express.bodyParser());
    });

    app.rest(Vegetable);
    app.listen(8012);

    done();
  },
  create: function(done) {
    // clear all first
    mongoose.models['vegetable'].remove({}, function (err) {
      if (err) return done(err);
      
      var names = ['Turnip', 'Spinach', 'Pea', 
		   'Shitake', 'Lima Bean', 
		   'Carrot', 'Zucchini', 'Radicchio'];
      vegetables = names.map( function (name) { // TODO leaking globals is lame...
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