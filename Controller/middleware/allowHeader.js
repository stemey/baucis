// __Module Definition__
var mixin = module.exports = function (activate) {
  var controller = this;

  // Build the "Allow" response header
  activate(true, 'request', function (request, response, next) {
    var allowed = request.baucis.controller.activeVerbs().map(function (verb) {
      if (verb === 'del') return 'DELETE';
      return verb.toUpperCase();
    });

    response.set('Allow', allowed.join());
    next();
  });

  return controller;
};
