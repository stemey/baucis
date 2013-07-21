// __Dependencies__
var url = require('url');
var express = require('express');
var Controller = require('./Controller');

// __Private Members__
var controllers = [];
var app = express();

// __Module Definition__
var baucis = module.exports = function (options) {
  options || (options = {});

  Object.keys(options).forEach(function (key) {
    app.set(key, options[key]);
  });

  controllers.forEach(function (controller) {
    var route = url.resolve('/', controller.get('plural'));
    controller.initialize();
    app.use(route, controller);
  });

  return app;
};

// __Public Methods__
baucis.rest = function (options) {
  var controller = Controller(options);

  // Publish unless told not to
  if (options.publish !== false) controllers.push(controller);

  return controller;
};
