baucis v0.2.0
=============

*** WORK IN PROGRESS ***

This is a work in progress, but should be mostly stable. The API is subject to change.

Baucis is Express middleware for automatically creating REST services from Mongoose schemata.

Like Baucis and Philemon of old, this library provides REST to the weary traveler.  The goal is to create a JSON REST API for Mongoose that matches as closely as possible the richness and versatility of the [HTTP 1.1 protocol](http://www.w3.org/Protocols/rfc2616/rfc2616.html).

![David Rjckaert III - Philemon and Baucis Giving Hospitality to Jupiter and Mercury](http://github.com/wprl/baucis/raw/master/david_rijckaert_iii-philemon_and_baucis.jpg "Hermes is like: 'Hey Baucis, don't kill that goose.  And thanks for the REST.'")

*David Rijckaert - Philemon and Baucis Giving Hospitality to Jupiter and Mercury*

An example of creating a REST API:

    var baucis = require('baucis');

    // Define a Mongoose schema
    var Vegetable = new Schema({
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

Later make requests:

 * GET /api/v1/vegetables/:id &mdash; get the addressed document
 * PUT /api/v1/vegetables/:id &mdash; create or update the addressed document
 * DEL /api/v1/vegetables/:id &mdash; delete the addressed object

 * GET /api/v1/vegetables &mdash; get all documents
 * POST /api/v1/vegetables &mdash; creates a new document and sends back its ID
 * PUT /api/v1/vegetables &mdash; replace all documents with given new documents
 * DEL /api/v1/vegetables &mdash; delete all documents

Baucis supports embedding controllers in other controllers, as well as embedding arbitrary routes and middleware.

    var controller = baucis.rest({
      singular: 'foo'
    });

    var subcontroller = baucis.rest({
      singular: 'bar',
      publish: false, // don't add routes automatically
      restrict: function (query) {
        query.where({ ticket: request.param('ticket') });
      }
    });

    // Embed the subcontroller at /foos/:fooId/bars
    controller.use('/:fooId/bars', subcontroller);

    // Embed arbitrary middleware
    controller.use('/:fooId/qux', function (request, response, next) {
      // Do something cool…
      next();
    });

Controllers are Express apps, so do whatever you want with them.

    var controller = baucis.rest({
      singular: 'robot'
    });

    controller.use(express.cookieParser());
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

An example `sync` method for a Backbone model:

      function (method, model, options) {
        var url  = '/api/v1/vegetables';

        if (method !== 'create') url += model.id;

        options = options || {};
        options.url = url;

        return Backbone.sync(method, model, options);
      }

Use middleware for security, etc.  Middleware is plain old Connect middleware, so it can be used with pre-existing modules like `passport`.  For example, set the `all` option to add middleware to be called before all the model's API routes.

    baucis.rest({
      schema: Vegetable,
      singular: 'vegetable',
      all: function (request, response, next) {
        if (request.isAuthenticated()) return next();
        return response.send(401);
      }
    });

Contact Info

 * http://kun.io/
 * @wprl

&copy; 2012-2013 William P. Riley-Land
