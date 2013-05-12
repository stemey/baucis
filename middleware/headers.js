var path = require('path');

var middleware = module.exports = {
  // Add "Link" header field, with some basic defaults
  link: function (request, response, next) {
    response.links({
      collection: request.app.get('basePath'),
      search: request.app.get('basePath'),
      edit: path.join(request.app.get('basePath'), request.params.id),
      self: path.join(request.app.get('basePath'), request.params.id),
      'latest-version': path.join(request.app.get('basePath'), request.params.id)
    });
    next();
  },
  // Add "Link" header field, with some basic defaults (for collection routes)
  linkCollection: function (request, response, next) {
    response.links({
      search: request.app.get('basePath'),
      self: request.app.get('basePath'),
      'latest-version': request.app.get('basePath')
    });
    next();
  },
  // Build the "Allow" response header
  allow: function (request, response, next) {
    var allowed = [];

    if (request.app.get('head') !== false) allowed.push('HEAD');
    if (request.app.get('get')  !== false) allowed.push('GET');
    if (request.app.get('post') !== false) allowed.push('POST');
    if (request.app.get('put')  !== false) allowed.push('PUT');
    if (request.app.get('del')  !== false) allowed.push('DELETE');

    response.set('Allow', allowed.join());
    next();
  },
  // Build the "Accept" response header
  accept: function (request, response, next) {
    response.set('Accept', 'application/json');
    next();
  },
  // Add the "Location" response header
  location: function (request, response, next) {
    response.set('Location', request.baucis.location);
    next();
  }
};
