// __Dependencies__
var Api = require('./Api');

// __Private Module Members__
var instance = Api();

// __Module Definition__
var Baucis = module.exports = function Baucis (options) {
  var previous = empty();
  return previous;
};

// __Public Methods__
Baucis.rest = function (options) {
  // TODO maybe only check publish here and not in Api
  var controller = instance.rest(options);
  return controller;
};

// TODO name? reset?
Baucis.empty = function () {
  var previous = instance;
  instance = Api();
  return previous;
};
