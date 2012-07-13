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

Use middleware for security, etc.

    TODO middleware/security code example

Still to do:

TODO list TODOs

Hello!

TODO contact