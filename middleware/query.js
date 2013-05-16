// Private Members
// ---------------
function getFindCondition (request) {
  var conditions = {};
  conditions[request.app.get('findBy')] = request.params.id;
  return conditions;
}

// Module Definition
// -----------------
var middleware = module.exports = {
  // Retrieve header for the addressed document
  head: function (request, response, next) {
    var Model = request.app.get('model');
    request.baucis.query = Model.findOne(getFindCondition(request));
    next();
  },
  // Retrieve documents matching conditions
  headCollection: function (request, response, next) {
    var Model = request.app.get('model');
    request.baucis.query = Model.find(request.baucis.conditions);
    next();
  },
  // Retrive the addressed document
  get: function (request, response, next) {
    var Model = request.app.get('model');
    request.baucis.query = Model.findOne(getFindCondition(request));
    next();
  },
  // Retrieve documents matching conditions
  getCollection: function (request, response, next) {
    var Model = request.app.get('model');
    request.baucis.query = Model.find(request.baucis.conditions);
    next();
  },
  // Treat the addressed document as a collection, and push
  // the addressed object to it
  post: function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  },
  // Create a new document and return its ID
  postCollection: function (request, response, next) {
    var body = request.body;
    var Model = request.app.get('model');
    var ids = [];
    var processedCount = 0;
    var wrap;

    // Must be an object or array
    if (!body || typeof body !== 'object') {
      return next(new Error('Must supply a document or array to POST'));
    }

    // Make it array if it wasn't already
    if (!Array.isArray(body)) body = [ body ];

    // No empty arrays
    if (body.length === 0) return next(new Error('Array was empty.'));

    wrap = {
      open: body.length === 1 ? '' : '[',
      close: body.length === 1 ? '' : ']'
    };

    // Stream the response JSON array
    response.set('Content-Type', 'application/json');
    response.status(201);
    response.write(wrap.open);

    body.forEach(function (doc) {
      Model.create(doc, function (error, savedDoc) {
        if (error) return next(error);

        processedCount += 1;

        response.write(JSON.stringify(savedDoc.toJSON()));

        ids.push(savedDoc.id);

        // Keep going if there are still more to process
        if (processedCount < body.length) return response.write(',');

        // Last one was processed
        request.baucis.location = request.app.get('basePath') + '?conditions={ _id: { $in: [' + ids.join() + '] } }';

        response.write(wrap.close);
        response.send();
      });
    });
  },
  // Replace the addressed document, or create it if it doesn't exist
  put: function (request, response, next) {
    var Model = request.app.get('model');
    var id = request.params.id;

    if (request.body._id && id !== request.body._id) {
      return next(new Error('ID mismatch'));
    }

    // Can't send id for update, even if unchanged
    delete request.body._id;

    Model.findOne(getFindCondition(request), function (error, doc) {
      if (error) return next(error);
      if (!doc) return next(new Error('No document with that ID was found'));

      doc.set(request.body);

      doc.save(function (error, savedDoc) {
        if (error) return next(error);

        request.baucis.documents = savedDoc;
        next();
      });
    });
  },
  // Replace all docs with given docs ...
  putCollection: function (request, response, next) {
    response.send(405); // method not allowed (as of yet unimplemented)
  },
  // Delete the addressed object
  del: function (request, response, next) {
    var Model = request.app.get('model');
    request.baucis.query = Model.remove(getFindCondition(request));
    next();
  },
  // Delete all documents matching conditions
  delCollection: function (request, response, next) {
    var Model = request.app.get('model');
    request.baucis.query = Model.remove(request.baucis.conditions);
    next();
  }
};
