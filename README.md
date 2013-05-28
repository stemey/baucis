baucis
=====================

This is a bit of a work in progress, but should be mostly stable, if not well documented at the moment.

![David Rjckaert III - Philemon and Baucis Giving Hospitality to Jupiter and Mercury](http://github.com/wprl/baucis/raw/master/david_rijckaert_iii-philemon_and_baucis.jpg "Hermes is like: 'Hey Baucis, don't kill that goose.  And thanks for the REST.'")

*David Rijckaert - Philemon and Baucis Giving Hospitality to Jupiter and Mercury*

Like Baucis and Philemon of old, this library provides REST to the weary traveler.  Automatically creates REST services from Mongoose schemata:

    var Vegetable = new Schema({
      name: String
    });

    Vegetable.metadata({
      singular: 'vegetable'
    });

    var app = express.createServer();
    app.configure(function(){
      app.use(express.bodyParser());
    });

    // create RESTful routes
    app.rest(Vegetable);

    app.listen(80);

Later make requests:

 * GET /vegetable/:id &mdash; get the addressed document
 * PUT /vegetable/:id &mdash; create or update the addressed document
 * DEL /vegetable/:id &mdash; delete the addressed object

 * GET /vegetables/ &mdash; get all documents (in the future will accept query args to pass to the mongo server)
 * POST /vegetables/ &mdash; creates a new document and sends back its ID
 * PUT /vegetables/ &mdash; replace all documents with given new documents
 * DEL /vegetables/ &mdash; delete all documents (also will accept query args in future)

Examples with jQuery:

    $.getJSON('/vegetable/4f4028e6e5139bf4e472cca1', function (data) {
      console.log(data);
    });

<<<<<<< Updated upstream
    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/vegetables/',
      data: { name: 'Potato' }
    }).done(function( id ) {
      console.log(id);
=======
Baucis adds middleware registration functions for three stages of the request cycle:

| Name | Description |
| ---- | ----------- |
| request | This stage of middleware will be called after baucis applies defaults based on the request, but before the Mongoose query is generated |
| query | This stage of middleware will be called after baucis applies defaults to the Mongoose query object, but before the documents or count is retrieved from the database.  The query can be accessed in your custom middleware via `request.baucis.query`.   |
| documents | This stage of middleware will be called after baucis executes the query, but before the documents or count are sent in the response.  The documents/count can be accessed in your custom middleware via `request.baucis.documents`.  |

Each of these functions has three forms:

The first form is the most specific.  The first argument lets you specify whether the middleware applies to document instances (paths like `/foos/:id`) or to collection requests (paths like `/foos`).  The second argument is a space-delimted list of HTTP verbs that the middleware should be applied to.  The third argument is the middleware function to add or an array of middleware functions.

    controller.request('instance', 'head get del', middleware);
    controller.request('collection', 'post', middleware);

To add middleware that applies to both document instances and collections, the first argument is omitted:

    controller.query('post put', function (request, response, next) {
      // do something with request.baucis.query
      next();
>>>>>>> Stashed changes
    });


app.rest will accept arrays, hashes, or single Schema objects.  An example with require-index:

    var schemata = requireindex('./schemata');
    app.rest(schemata);

Use middleware for security, etc.  Middleware is plain old Connect middleware, so it can be used with pre-existing modules like passport.  Set the middleware metadata to a function or array of functions.

    Vegetable.metadata({
      singular: 'vegetable',
      middleware: function(request, response, next) {
        if (request.isAuthenticated()) return next();
        else return response.send(401);
      }
    });

Contact Info

 * http://william.nodejitsu.com/
 * @wprl

&copy; 2012 William P. Riley-Land
