var path = require('path');

var middleware = module.exports = {
  exec: function (request, response, next) {
    var ids;

    // 404 if document(s) not found or 0 documents removed
    if (!request.baucis.documents) return response.send(404);

    if (!Array.isArray(request.baucis.documents)
      || request.baucis.documents.length === 1) {
      request.baucis.location = path.join(request.app.get('basePath'), request.baucis.documents.id);
    }
    else {
      ids = request.baucis.documents.map(function (doc) { return doc.id });
      request.baucis.location = request.app.get('basePath') + '?conditions={ _id: { $in: [' + ids.join() + '] } }';
    }

    response.json(request.baucis.documents);
  },
  count: function (request, response, next) {
    // 404 if no matching documents
    if (request.baucis.count === 0) return response.send(404);
    response.json(request.baucis.count);
  },
  stream: function (request, response, next) {
    var firstWasProcessed = false;

    request.baucis.stream.resume();

    response.set('Content-Type', 'application/json');
    response.write('[');

    request.baucis.stream.on('error', next);
    request.baucis.stream.on('data', function (doc) {
      if (firstWasProcessed) response.write(',');
      response.write(JSON.stringify(doc.toJSON()));
      firstWasProcessed = true;
    });
    request.baucis.stream.on('close', function () {
      response.write(']');
      response.send();
    });
  },
  promises: function (request, response, next) {
    next();
  }
}
