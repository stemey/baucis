baucis
=====================

![David Rjckaert III - Philemon and Baucis Giving Hospitality to Jupiter and Mercury](http://github.com/murmux/baucis/raw/master/david_rijckaert_iii-philemon_and_baucis.jpg "Hermes is like: 'Hey Baucis, don't kill that goose.  And thanks for the REST.'")

David Rijckaert - Philemon and Baucis Giving Hospitality to Jupiter and Mercury

Like Baucis and Philemon of old, this library provides REST to the weary traveler.  Automatically creates REST services from Mongoose models:

    var Vegetable = new Schema({
      name: String
    });

    Vegetable.metadata({
      singular: 'vegetable',
      plural: 'vegetables'
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
 * POST /vegetable/:id &mdash; currently unimplemented (in the future will push the data into a field specified for the addressed object)
 * PUT /vegetable/:id &mdash; create or update the given document
 * DEL /vegetable/:id &mdash; delete the addressed object

 * GET /vegetables/ &mdash; get all documents (in the future will accept query args to pass to the mongo server)
 * POST /vegetables/ &mdash; creates a new object and send back its ID  
 * PUT /vegetables/ &mdash; replace all documents with given new documents
 * DEL /vegetables/ &mdash; delete all documents (also will accept query args in future)

Examples with jQuery:

    $.getJSON('/vegetable/4f4028e6e5139bf4e472cca1', function (data) {
      console.log(data);
    });

    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/vegetables/',
      data: { name: 'Potato' }
    }).done(function( id ) {
      console.log(id);
    });


app.rest will accept arrays, hashes, or single Schema objects.  An example with require-index:

    var schemata = requireindex('./schemata');
    app.rest(schemata);

Use middleware for security, etc.  Middleware is plain old Connect middleware, so it can be used with pre-existing modules like passport.  Set the middleware metadata to a function or array of functions.

    Vegetable.metadata({
      singular: 'vegetable',
      plural: 'vegetables',
      middleware: function(request, response, next) {
        if (request.isAuthenticated()) return next();
        else return response.send(401);
      }
    });

Contact Info

 * http://william.nodejitsu.com/
 * @wprl

&copy; 2012 William P. Riley-Land
Licensed under the GPL v3  
Please fork and create issues!
