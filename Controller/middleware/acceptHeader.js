// __Module Definition__
var mixin = module.exports = function (activate) {
  var controller = this;

  // Build the "Accept" response header.
  activate(true, 'request', function (request, response, next) {
    var putOff = (request.baucis.controller.get('put') === false);
    var postOff = (request.baucis.controller.get('post') === false);

    if (putOff && postOff) return next();

    response.set('Accept', 'application/json, application/x-www-form-urlencoded');
    next();
  });

  return controller;
};
