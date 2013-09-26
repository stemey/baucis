// __Module Definition__
var middleware = module.exports = {
  // Set the conditions used for finding/removing documents
  conditions: function (request, response, next) {
    if (!request.query.conditions) return next();

    request.baucis.conditions = JSON.parse(request.query.conditions);
    next();
  },
  // Specify that a count, rather than documents, should be returned
  count: function (request, response, next) {
    if (!request.query.count) return next();

    request.baucis.count = true;
    next();
  },
  // Apply various options based on controller parameters
  controller: function (request, response, next) {
    if (request.app.get('select') && request.baucis.query) {
      request.baucis.query.select(request.app.get('select'));
    }
    next();
  },
  deprecated: function (request, response, next) {
    // Controller Options
    if (request.app.get('restrict')) return next(new Error('The "restrict" controller options is deprecated.  Use query middleware instead.'));
    // Headers
    if (request.headers['x-baucis-push']) return next(new Error('The "X-Baucis-Push header" is deprecated.  Use "X-Baucis-Update-Operator: $push" instead.'));
    // No deprecated features found.
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
    if (request.query.select && request.baucis.query) {
      if (request.query.select.indexOf('+') !== -1) {
        return next(new Error('Including excluded fields is not permitted.'));
      }
      if (request.app.checkBadSelection(request.query.select)) {
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
        if (request.app.checkBadSelection(field.path || field)) {
          return next(new Error('Including excluded fields is not permitted.'));
        }
        // Don't allow selecting fields from client when populating
        if (field.select) {
          return next(new Error('May not set selected fields of populated document.'));
        }

        query.populate(field);
      });
    }

    next();
  }
};
