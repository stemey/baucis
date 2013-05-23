baucis v0.4.6-2
===============

Baucis is Express middleware that creates configurable REST APIs using Mongoose schemata.

Like Baucis and Philemon of old, this library provides REST to the weary traveler.  The goal is to create a JSON REST API for Mongoose & Express that matches as closely as possible the richness and versatility of the [HTTP 1.1 protocol](http://www.w3.org/Protocols/rfc2616/rfc2616.html).

Those versions published to npm represent release versions.  Those versions not published to npm are development releases.

Relase versions of baucis can be considered stable.  Baucis uses [semver](http://semver.org).

Please report issues on GitHub if bugs are encountered.

![David Rjckaert III - Philemon and Baucis Giving Hospitality to Jupiter and Mercury](http://github.com/wprl/baucis/raw/master/david_rijckaert_iii-philemon_and_baucis.jpg "Hermes is like: 'Hey Baucis, don't kill that goose.  And thanks for the REST.'")

*David Rijckaert - Philemon and Baucis Giving Hospitality to Jupiter and Mercury*

Usage
-----

To install:

    npm install baucis

An example of creating a REST API from a couple Mongoose schemata:

    var Vegetable = new mongoose.Schema({
      name: String
    });

    var Fruit = new mongoose.Schema({
      name: String
    });

    // Note that Mongoose middleware will be executed as usual
    Vegetable.pre('save', function () { ... });

    // Register the schemata
    mongoose.model('vegetable', Vegetable);
    mongoose.model('fruit', Fruit);

    // Create the API routes
    baucis.rest({
      singular: 'vegetable',
    });

    baucis.rest({
      singular: 'fruit'
    });

    // Create the app and listen for API requests
    var app = express();
    app.use('/api/v1', baucis());
    app.listen(80);

Later, make requests:

 * GET /api/v1/vegetables &mdash; get all or a subset of documents
 * GET /api/v1/vegetables/:id &mdash; get the addressed document
 * POST /api/v1/vegetables &mdash; creates new documents and sends them back.  You may post a single document or an array of documents.
 * PUT /api/v1/vegetables/:id &mdash; update the addressed document
 * DEL /api/v1/vegetables &mdash; delete all or a subset of documents
 * DEL /api/v1/vegetables/:id &mdash; delete the addressed object


HTTP Headers
------------

 * `ETag` is supported out-of-the-box by Express
 * `Last-Modified` can be set by passing `lastModified: 'foo'` to `baucis.rest` in order to set the header field to the value of that path on all requests.
 GET requests to the collection set the field to the latest date out of all documents returned by the query. (*Cool huh?*)
 * `Accept: application/json` is set for all responses.
 * The `Allow` header is set automatically, correctly removing HTTP verbs when
   those verbs have been disabled with e.g. `put: false`.
 * The `Location` HTTP header is set for PUT and POST responses.
 * If `relations: true` is passed to `baucis.rest`, the HTTP `Link` header will be set with various links for all responses.


Examples
--------

 * [Examples with jQuery](examples/jQuery.js)
 * [Examples with Backbone](examples/Backbone.js)

Query Options
-------------

 * `conditions` — Set the Mongoose query's `find` or `remove` arguments when using verbs `HEAD`, `GET`, `DELETE` with collection endpoints.
 * `skip` — Don't send the first *n* documents in the response.
 * `limit` – Limit the response document count to *n*
 * `select` — Set which fields should be selected for response documents
 * `sort` — Sort response documents by the given criteria.  `sort: 'foo -bar'`' sorts the collection by `foo` in ascending order, then by `bar` in descending order.
 * `populate` — Set which fields should be populated for response documents.  See the Mongoose [population documentation](http://mongoosejs.com/docs/populate.html) for more information.

It is not permitted to use the `select` query option or the `select` option of `populate` with a `+path`.  This is to allow a mechanism for hiding fields from client software.

You can deselect paths in the schema definition using `select: false` or in the controller options using `select: '-foo'` and your server middleware will able to select these fields as usual using `query.select`, while preventing the client from selecting the field.

`bacuis.rest`
-------------

Use plain old Connect/Express middleware, including pre-existing modules like `passport`.  For example, set the `all` option to add middleware to be called before all the model's API routes.

    baucis.rest({
      singular: 'vegetable',
      all: function (request, response, next) {
        if (request.isAuthenticated()) return next();
        return response.send(401);
      }
    });

Or, set some middleware for specific HTTP verbs or disable verbs completely:

    baucis.rest({
      singular: 'vegetable',
      get: [middleware1, middleware2],
      post: middleware3,
      del: false,
      put: false
    });

Controllers
-----------

`baucis.rest` returns an instance of the controller created to handle the schema's API routes.

    var subcontroller = baucis.rest({
      singular: 'bar',
      basePath: '/:fooId/bars',
      publish: false, // don't add API routes automatically
      select: 'foo +bar -password', // select fields for all queries
      findBy: 'baz', // use this field instead of `_id` for queries
      lastModified: 'lastUpdatedField', // Set the `Last-Modified` HTTP header using this field
      restrict: function (query, request) {
        // Only retrieve bars that are children of the given foo
        query.where('parent', request.params.fooId);
      }
    });

    var controller = baucis.rest({
      singular: 'foo',
      configure: function (controller) {
        // Embed the subcontroller at /foos/:fooId/bars
        controller.use(subcontroller);

        // Embed arbitrary middleware at /foos/qux
        controller.use('/qux', function (request, response, next) {
          // Do something cool…
          next();
        });
      }
    });

Controllers are Express apps, so do whatever you want with them.

    var controller = baucis.rest({
      singular: 'robot',
      configure: function (controller) {
        // Add middleware before all other rotues in the controller
        controller.use(express.cookieParser());
      }
    });

    // Add middleware after default controller routes
    controller.use(function () { ... });
    controller.set('some option name', 'value');
    controller.listen(3000);

Baucis uses the power of Express, without getting in its way.  It's meant to be a way to organize your REST API's Express middleware.

Contact Info
------------

 * http://kun.io/
 * @wprl

&copy; 2012-2013 William P. Riley-Land
