baucis v0.2.1
=============

*** WORK IN PROGRESS ***

This is a work in progress, but should be mostly stable. The API is subject to change.

Baucis is Express middleware for automatically creating REST services from Mongoose schemata.

Like Baucis and Philemon of old, this library provides REST to the weary traveler.  The goal is to create a JSON REST API for Mongoose that matches as closely as possible the richness and versatility of the [HTTP 1.1 protocol](http://www.w3.org/Protocols/rfc2616/rfc2616.html).

![David Rjckaert III - Philemon and Baucis Giving Hospitality to Jupiter and Mercury](http://github.com/wprl/baucis/raw/master/david_rijckaert_iii-philemon_and_baucis.jpg "Hermes is like: 'Hey Baucis, don't kill that goose.  And thanks for the REST.'")

*David Rijckaert - Philemon and Baucis Giving Hospitality to Jupiter and Mercury*

An example of creating a REST API from a Mongoose schema:

    // Define a Mongoose schema
    var Vegetable = new mongoose.Schema({
      name: String
    });

    // Create routes for the schema
    baucis.rest({
      singular: 'vegetable'
    });

    // Create the app and listen for API requests
    var app = express();
    app.use('/api/v1', baucis());
    app.listen(80);

Later, make requests:

 * GET /api/v1/vegetables/:id &mdash; get the addressed document
 * PUT /api/v1/vegetables/:id &mdash; create or update the addressed document
 * DEL /api/v1/vegetables/:id &mdash; delete the addressed object

 * GET /api/v1/vegetables &mdash; get all documents
 * POST /api/v1/vegetables &mdash; creates a new document and sends back its ID
 * PUT /api/v1/vegetables &mdash; replace all documents with given new documents
 * DEL /api/v1/vegetables &mdash; delete all documents

`baucis.rest` returns an instance of the controller created to handle the schema's routes.

    var controller = baucis.rest({
      singular: 'foo'
    });

    var subcontroller = baucis.rest({
      singular: 'bar',
      publish: false, // don't add routes automatically
      restrict: function (query, request) { // allows direct access to the Mongoose queries
        query.where({ parent: request.params.fooId });
      }
    });

    // Embed the subcontroller at /foos/:fooId/bars
    controller.use('/:fooId/bars', subcontroller);

    // Embed arbitrary middleware at /foos/:fooId/qux
    controller.use('/:fooId/qux', function (request, response, next) {
      // Do something cool…
      next();
    });

Controllers are Express apps, so do whatever you want with them.

    var controller = baucis.rest({
      singular: 'robot'
    });

    controller.use(function () { ... });
    controller.set('some option name', 'value');
    controller.listen(3000);

Baucis uses the power of Express, without getting in its way.  It's meant to be a way to organize your REST API's Express middleware.

Requests to the collection (not its members) take standard MongoDB query parameters to filter the documents based on custom criteria.

Examples with jQuery:

    $.getJSON('/api/v1/vegetables/4f4028e6e5139bf4e472cca1', function (data) {
      console.log(data);
    });

    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/api/v1/vegetables',
      data: { name: 'Potato' }
    }).done(function (vegetable) {
      console.dir(vegetable);
    });

An example with Backbone:

    var Foos = Backbone.Collection.extend({
      url: '/foos'
    });

    var Bar = Backbone.Model.extend({
      urlRoot: '/bars'
    });

Use plain old Connect/Express middleware, including pre-existing modules like `passport`.  For example, set the `all` option to add middleware to be called before all the model's API routes.

    baucis.rest({
      singular: 'vegetable',
      all: function (request, response, next) {
        if (request.isAuthenticated()) return next();
        return response.send(401);
      }
    });

Or, set some middleware for specific HTTP verbs:

    baucis.rest({
      singular: 'vegetable',
      get: [middleware1, middleware2],
      post: middleware3,
      del: [middleware4, middleware5]
    });

Contact Info
------------

 * http://kun.io/
 * @wprl

&copy; 2012-2013 William P. Riley-Land
