var middleware = module.exports = {
  lastModified: function (request, response, next) {
    var lastModifiedPath = request.app.get('lastModified');
    if (!lastModifiedPath) return next();

    var modifiedDates = [].concat(request.baucis.documents).map(function (doc) {
      return doc.get(lastModifiedPath);
    });

    // Validate
    // TODO allow/convert Timestamp, Number, ISODate
    modifiedDates.forEach(function (modified) {
      if (modified instanceOf Date) return;
      else next(new Error('lastModified path was not a date'));
    });

    // Find the latest date
    var lastModified = Math.max.apply(null, modifiedDates);

    // Stringify to RFC 822, updated by RFC 1123 e.g. Sun, 06 Nov 1994 08:49:37 GMT
    response.set('Last-Modified', lastModified.toUTCString());

    next();
  },
  send: function (request, response, next) {
    var ids;
    var documents = request.baucis.documents || request.baucis.count;

    // 404 if document(s) not found or 0 documents removed/counted
    if (!documents) return response.send(404);

    // If it's a document count (e.g. the result of a DELETE), send it back and short-circuit
    if (typeof documents === 'number') {
      return response.json(documents);
    }

    // Otherwise, set the location and send JSON document(s)
    if (!Array.isArray(documents)
      || documents.length === 1) {
      request.baucis.location = path.join(request.app.get('basePath'), documents.id);
    }
    else {
      ids = documents.map(function (doc) { return doc.id });
      request.baucis.location = request.app.get('basePath') + '?conditions={ _id: { $in: [' + ids.join() + '] } }';
    }

    response.json(documents);
  }
};
