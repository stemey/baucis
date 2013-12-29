  // Apply various options based on controller parameters
  controller: function (request, response, next) {
    if (request.baucis.controller.get('select') && request.baucis.query) {
      request.baucis.query.select(request.baucis.controller.get('select'));
    }
    next();
  },
