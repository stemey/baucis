baucis
=====================

![David Rjckaert III - Philemon and Baucis Giving Hospitality to Jupiter and Mercury](https://github.com/murmux/baucis/raw/master/david_rijckaert_iii-philemon_and_baucis.jpg "Hermes is like: 'Hey Baucis, don't kill that goose.  And thanks for the REST.'")

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

app.rest will accept arrays, hashes, or single Schema objects.  An example with require-index:

    var schemata = requireindex('./schemata');
    app.rest(schemata);

Use middleware for security, etc.  Middleware is plain old Connect middleware, so it can be used with pre-existing modules like passport.

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