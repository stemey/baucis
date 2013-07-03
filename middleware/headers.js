// Dependencies
// ------------
var url = require('url');
var extend = require('util')._extend;
var qs = require('querystring');

// Module Definition
// -----------------
var middleware = module.exports = {
  // Add "Link" header field, with some basic defaults
  link: function (request, response, next) {
    response.links({
      collection: request.app.get('basePath'),
      search: request.app.get('basePath'),
      edit: url.resolve(request.app.get('basePath'), request.params.id),
      self: url.resolve(request.app.get('basePath'), request.params.id),
      'latest-version': url.resolve(request.app.get('basePath'), request.params.id)
    });
    next();
  },
  // Add "Link" header field, with some basic defaults (for collection routes)
  linkCollection: function (request, response, next) {
    response.links({
      search: request.app.get('basePath'), // TODO use request.originalUrl or request.path, relative, strip query
      self: request.app.get('basePath'),
      'latest-version': request.app.get('basePath')
    });
    next();
  },
  // Add paging links to the Link header (for collection routes)
  linkPaging: function (request, response, next) {
    if (!request.query.limit) return next();

    request.baucis.query.count(function (error, count) {
      if (error) return next(error);

      var limit = Number(request.query.limit);
      var skip = Number(request.query.skip || 0);
      var makeLink = function (query) {
        var extended = extend(request.query, query || {});
        var originalPath = request.originalUrl.split('?')[0];
        return originalPath + '?' + qs.stringify(extended); // TODO r.p works with mounting?
      };
      var links = {
        first: makeLink({ skip: 0 }),
        last: makeLink({ skip: Math.max(0, count - limit) })
        // TODO Duplicated from linkCollection() should be factored out
        // TODO check overwrite vs append
        // search: request.path, // TODO works with mounted?
        // self: makeLink(), // or originalUrl TODO
        // 'latest-version': makeLink() // or originalUrl TODO
      };

      if (skip) links.previous = makeLink({ skip: Math.max(0, skip - limit) });
      if (limit + skip < count) links.next =  makeLink({ skip: limit + skip });

      response.links(links);

      next();
    });
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
    if (request.baucis.location) response.set('Location', request.baucis.location);
    next();
  },
  eTag: function (request, response, next) {
    // TODO does Express do this automatically?
    // TODO add versioning option for strong Etags
    // TODO how does this work with Vary/query options like populate -- do MD5?
    response.set('ETag', 'W/"' + request.baucis.model.id + '"');
  }
};
