var mongoose = require('mongoose');
var express  = require('express');
var baucis   = require('./index');

var app;
var server;

var Schema = mongoose.Schema;

function start() {
  app = express();

  app.use(express.logger('dev'));

  app.use('/api', baucis.rest(Vegetable));

  app.use(app.router);

  app.listen(8012);
}

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

// clear all first
mongoose.models['vegetable'].remove({}, function (err) {
  if (err) throw new Error(err);

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
      if (err)                throw new Error(err);
      if (numberToSave === 0) start();
    });
  });
});


