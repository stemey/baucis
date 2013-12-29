// __Module Definition__
var mixin = module.exports = function (activate) {
  var controller = this;

  // Build the "Allow" response header
  activate(false, 'request', function (request, response, next) {
    // Controller Options
    if (request.baucis.controller.get('restrict')) return next(new Error('The "restrict" controller options is deprecated.  Use query middleware instead.'));
    // Headers
    if (request.headers['x-baucis-push']) return next(new Error('The "X-Baucis-Push header" is deprecated.  Use "X-Baucis-Update-Operator: $push" instead.'));
    // No deprecated features found.
    next();
  });

  return controller;
};
