baucis v0.0.2
=====================

*** WORK IN PROGRESS ***

This is a work in progress, but should be mostly stable…

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
      app.use('/api', baucis.rest(Vegetable));
    });

    app.listen(80);

Later make requests:

 * GET /api/vegetables/:id &mdash; get the addressed document
 * PUT /api/vegetables/:id &mdash; create or update the addressed document
 * DEL /api/vegetables/:id &mdash; delete the addressed object

 * GET /api/vegetables/ &mdash; get all documents
 * POST /api/vegetables/ &mdash; creates a new document and sends back its ID
 * PUT /api/vegetables/ &mdash; replace all documents with given new documents
 * DEL /api/vegetables/ &mdash; delete all documents

Requests to the collection (not its members) take standard MongoDB query parameters to filter the documents based on custom criteria.

Examples with jQuery:

    $.getJSON('/api/vegetables/4f4028e6e5139bf4e472cca1', function (data) {
      console.log(data);
    });

    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/api/vegetables/',
      data: { name: 'Potato' }
    }).done(function( id ) {
      console.log(id);
    });


`baucis.rest` will accept arrays, hashes, or single `Schema` objects.  An example with require-index:

    var schemata = requireindex('./schemata');
    app.user('/api/v1', baucis.rest(schemata));

Use middleware for security, etc.  Middleware is plain old Connect middleware, so it can be used with pre-existing modules like passport.  Set the middleware metadata to a function or array of functions.

    Vegetable.metadata({
      singular: 'vegetable',
      middleware: function(request, response, next) {
        if (request.isAuthenticated()) return next();
        return response.send(401);
      }
    });

Contact Info

 * http://kun.io/
 * @wprl

&copy; 2012 William P. Riley-Land
