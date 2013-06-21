var mongoose = require('mongoose');
var express = require('express');
var baucis = require('../..');

var app;
var server;
var controller;
var subcontroller;

var fixture = module.exports = {
  init: function(done) {
    var Schema = mongoose.Schema;

    mongoose.connect('mongodb://localhost/xXxBaUcIsTeStXxX');

    var Stores = new Schema({
      name: { type: String, required: true }
    });

    var Tools = new Schema({
      name: { type: String, required: true }
    });

    if (!mongoose.models['store']) mongoose.model('store', Stores);
    if (!mongoose.models['tool']) mongoose.model('tool', Tools);

    subcontroller = baucis.rest({
      singular: 'tool',
      basePath: '/:storeId/tools',
      publish: false
    });

    subcontroller.initialize();

    controller = baucis.rest({
      singular: 'store'
    });

    controller.get('/info', function (request, response, next) {
      response.json('OK!');
    });

    controller.use(subcontroller);

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
    mongoose.model('store').remove({}, function (error) {
      if (error) return done(error);

      mongoose.model('tool').remove({}, function (error) {
        if (error) return done(error);

        // create stores and tools
        mongoose.model('store').create(
          ['Westlake', 'Lowes'].map(function (name) { return { name: name } }),
          function (error) {
            if (error) return done(error);

            mongoose.model('tool').create(
              ['Hammer', 'Saw', 'Axe'].map(function (name) { return { name: name } }),
              done
            );
          }
        );
      });
    });
  }
};
