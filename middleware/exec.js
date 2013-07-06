// Dependencies
// ------------
var async = require('async');
var extend = require('util')._extend;

// Module Definition
// -----------------
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
    request.baucis.query.exec(function (error, doc) {
      // TODO handle array

      if (error) return next(error);
      if (!doc) return next(new Error('No document with that ID was found'));

      // Can't send id for update, even if unchanged
      var update = extend(request.body);
      delete update._id;

      doc.set(update);

      doc.save(function (error, savedDoc) {
        if (error) return next(error);

        request.baucis.documents = savedDoc;
        next();
      });
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
