// __Module Definition__
var mixin = module.exports = function (activate) {
  var controller = this;

  activate(true, 'request', function (request, response, next) {
    if (request.baucis) return next(new Error('Baucis request property already created!'));
    request.baucis = {};
    request.baucis.controller = controller;
    response.set('X-Powered-By', 'Baucis');
    next();
  });

  return controller;
};
