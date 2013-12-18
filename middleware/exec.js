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
  del: function (request, response, next) {
    request.baucis.query.exec(function (error, documents) {
      if (error) return next(error);
      if (!documents) return response.send(404);

      // Make it an array if it wasn't already
      var tasks = [].concat(documents).map(function (doc) {
        return doc.remove.bind(doc);
      });

      async.parallel(tasks, function (error, removed) {
        if (error) return next(error);
        request.baucis.documents = removed.length;
        next();
      });

    });
  },
  count: function (request, response, next) {
    var lastModifiedPath = request.baucis.controller.get('lastModified');

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
    var operator = request.headers['x-baucis-update-operator'];
    var update = extend(request.body);
    var done = function (error, saved) {
      if (error) return next(error);
      request.baucis.documents = saved;
      next();
    };

    if (operator && validOperators.indexOf(operator) === -1) return next(new Error('Unsupported update operator: ' + operator));

    request.baucis.query.exec(function (error, doc) {
      if (error) return next(error);
      if (!doc) return response.send(404);

      if (!operator) {
        doc.set(update);
        doc.save(done);
        return;
      }

      // Non-default operator
      var conditions = request.baucis.controller.getFindByConditions(request);
      var updateWrapper = {};

      updateWrapper[operator] = update;

      // Oh man I really want this to trigger validation…
      //      var pathParts = 'arbitrary.$.llama'.split('.');
      //
      //      doc.get(parts[0]) //arr
      //      subdoc = ...;// find one(s) that matches where for query
      //      subdoc.push(parts[2], val)

      // Ensure that some paths have been enabled for the operator.
      if (!request.baucis.controller.get('allow ' + operator)) return next(new Error('Update operator not enabled for this controller: ' + operator));

      // Make sure paths have been whitelisted for this operator.
      if (request.baucis.controller.checkBadUpdateOperatorPaths(operator, Object.keys(update))) {
        return next(new Error("Can't use update operator with non-whitelisted paths."));
      }

      request.baucis.controller.get('model').findOneAndUpdate(conditions, updateWrapper, done);
    });
  },
  // Create new document(s) and send them back in the response
  create: function (request, response, next) {
    var saved = [];
    var documents = request.body;
    var Model = request.baucis.controller.get('model');

    // Must be an object or array
    if (!documents || typeof documents !== 'object') {
      return next(new Error('Must supply a document or array to POST.'));
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

        var ids = [].concat(saved).map(function (doc) { return doc._id });
        var query = Model.find({ _id: { $in: ids } });
        var selected = { // TODO move to request.baucis i.e. set elsewhere
          controller: request.baucis.controller.get('select'),
          query: request.query.select
        };

        if (selected.controller) query.select(selected.controller);
        if (selected.query) query.select(selected.query);

        // Reload models and apply select options
        query.exec(function (error, reloaded) {
          if (error) return next(error);
          request.baucis.documents = reloaded.length === 1 ? reloaded[0] : reloaded;
          next();
        });
      }
    );
  }
};
