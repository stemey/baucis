// Set the conditions used for finding/removing documents
  conditions: function (request, response, next) {
    if (!request.query.conditions) return next();

    var conditions = request.query.conditions;
    if (typeof request.query.conditions === 'string') conditions = JSON.parse(conditions);

    request.baucis.conditions = conditions;
    next();
  }
