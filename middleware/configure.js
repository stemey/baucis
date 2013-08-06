function isBadSelection (paths, select) {
  var bad = false;
  paths.forEach(function (path) {
    var badPath = new RegExp('\\b[+]?' + path + '\\b', 'i');
    if (badPath.exec(select)) bad = true;
  });
  return bad;
}

// __Module Definition__
var middleware = module.exports = {
  // Set the conditions used for finding/removing documents
  conditions: function (request, response, next) {
    if (!request.query.conditions) return next();

    request.baucis.conditions = JSON.parse(request.query.conditions);
    next();
  },
  // Apply various options based on controller parameters
  controller: function (request, response, next) {
    if (request.app.get('select')) request.baucis.query.select(request.app.get('select'));
    if (request.app.get('restrict')) return next(new Error('Use query middleware instead'));
    next();
  },
  // Apply various options based on request query parameters
  query: function (request, response, next) {
    var populate;
    var error;
    var query = request.baucis.query;

    if (request.query.sort) query.sort(request.query.sort);
    if (request.query.skip) query.skip(request.query.skip);
    if (request.query.limit) query.limit(request.query.limit);
    if (request.query.select) {
      if (request.query.select.indexOf('+') !== -1) {
        return next(new Error('Including excluded fields is not permitted.'));
      }
      if (isBadSelection(request.app.get('deselected paths'), request.query.select)) {
        return next(new Error('Including excluded fields is not permitted.'));
      }
      query.select(request.query.select);
    }
    if (request.query.populate) {
      populate = request.query.populate;
      if (populate.indexOf('{') !== -1) populate = JSON.parse(request.query.populate);
      else if (populate.indexOf('[') !== -1) populate = JSON.parse(request.query.populate);

      if (!Array.isArray(populate)) populate = [ populate ];

      populate.forEach(function (field) {
        if (isBadSelection(request.app.get('deselected paths'), field.path || field)) {
          return next(new Error('Including excluded fields is not permitted.'));
        }
        // Don't allow selecting +field from client
        if (field.select) {
          return next(new Error('May not set selected fields of populated document.'));
        }

        query.populate(field);
      });
    }

    next();
  }
};
