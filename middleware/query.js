// __Module Definition__
var middleware = module.exports = {
  instance: {
    // Retrieve header for the addressed document
    head: function (request, response, next) {
      var Model = request.baucis.controller.get('model');
      request.baucis.noBody = true;
      request.baucis.query = Model.findOne(request.baucis.controller.getFindByConditions(request));
      next();
    },
    // Retrieve the addressed document
    get: function (request, response, next) {
      var Model = request.baucis.controller.get('model');
      request.baucis.query = Model.findOne(request.baucis.controller.getFindByConditions(request));
      next();
    },
    // Treat the addressed document as a collection, and push
    // the addressed object to it
    post: function (request, response, next) {
      response.send(405); // method not allowed
    },
    // Update the addressed document
    put: function (request, response, next) {
      var Model = request.baucis.controller.get('model');
      var bodyId = request.body[request.baucis.controller.get('findBy')];

      if (bodyId && request.params.id !== bodyId) return next(new Error('ID mismatch'));

      request.baucis.updateWithBody = true;
      request.baucis.query = Model.findOne(request.baucis.controller.getFindByConditions(request));
      next();
    },
    // Delete the addressed object
    del: function (request, response, next) {
      var Model = request.baucis.controller.get('model');
      request.baucis.query = Model.findOne(request.baucis.controller.getFindByConditions(request));
      next();
    }
  },
  collection: {
    // Retrieve documents matching conditions
    head: function (request, response, next) {
      var Model = request.baucis.controller.get('model');
      request.baucis.noBody = true;
      request.baucis.query = Model.find(request.baucis.conditions);
      next();
    },
    // Retrieve documents matching conditions
    get: function (request, response, next) {
      var Model = request.baucis.controller.get('model');
      request.baucis.query = Model.find(request.baucis.conditions);
      next();
    },
    // Update all given docs ...
    put: function (request, response, next) {
      response.send(405); // method not allowed
    },
    // Delete all documents matching conditions
    del: function (request, response, next) {
      var Model = request.baucis.controller.get('model');
      request.baucis.query = Model.find(request.baucis.conditions);
      next();
    }
  }
};
