// __Dependencies__
var async = require('async');
var extend = require('util')._extend;

// __Private Module Members__
var validOperators = [ '$set', '$push', '$pull' ];

// __Module Definition__
var middleware = module.exports = {
  exec: function (request, response, next) {
    request.baucis.query.exec(function (error, documents) {
      if (error) return next(error);
      request.baucis.documents = documents;
      next();
    });
  },
  count: function (request, response, next) {
    var lastModifiedPath = request.app.get('lastModified');

    request.baucis.count = true;

    if (lastModifiedPath) {
      request.baucis.query.select('-_id ' + lastModifiedPath);
      request.baucis.query.exec(function (error, documents) {
        if (error) return next(error);
        request.baucis.documents = documents;
        next();
      });
    }
    else {
      request.baucis.query.count(function (error, count) {
        if (error) return next(error);
        request.baucis.documents = count;
        next();
      });
    }
  },
  update: function (request, response, next) {
    var operator = request.headers['x-baucis-update-operator'] || '$set';
    var update = extend(request.body);
    var done = function (error, saved) {
      if (error) return next(error);
      request.baucis.documents = saved;
      next();
    };

    if (validOperators.indexOf(operator) === -1) return next(new Error('Unsupported update operator: ' + operator));

    request.baucis.query.exec(function (error, doc) {
      if (error) return next(error);
      if (!doc) return response.send(404);

      if (operator === '$set') {
        doc.set(update);
        doc.save(done);
        return;
      }

      // Non-default operator
      var conditions = request.app.getFindByConditions(request);
      var updateWrapper = {};

      updateWrapper[operator] = update;

      // Oh man I really want this to trigger validation…
      //      var pathParts = 'arbitrary.$.llama'.split('.');
      //
      //      doc.get(parts[0]) //arr
      //      subdoc = ...;// find one(s) that matches where for query
      //      subdoc.push(parts[2], val)

      // Ensure that some paths have been enabled for the operator.
      if (!request.app.get('allow ' + operator)) return next(new Error('Update operator not enabled for this controller: ' + operator));

      // Make sure paths have been whitelisted for this operator.
      if (request.app.checkBadUpdateOperatorPaths(operator, Object.keys(update))) {
        return next(new Error("Can't use update operator with non-whitelisted paths."));
      }

      request.app.get('model').findOneAndUpdate(conditions, updateWrapper, done);
    });
  },
  // Create new document(s) and send them back in the response
  create: function (request, response, next) {
    var saved = [];
    var documents = request.body;
    var Model = request.app.get('model');

    // Must be an object or array
    if (!documents || typeof documents !== 'object') {
      return next(new Error('Must supply a document or array to POST'));
    }

    // Make it an array if it wasn't already
    documents = [].concat(documents);

    // No empty arrays
    if (documents.length === 0) return next(new Error('Array was empty.'));

    response.status(201);

    async.map(
      documents,
      function (doc, callback) {
        var created = new Model();
        created.set(doc);
        created.save(callback);
      },
      function (error, saved) {
        if (error) return next(error);
        request.baucis.documents = saved.length === 1 ? saved[0] : saved;
        next();
      }
    );
  }
};
