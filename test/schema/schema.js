var expect = require('expect.js');
var Schema = require('mongoose').Schema;
var SchemaGenerator = require('../../mixins/schema.js');

var generator = new SchemaGenerator();

var Berry = new Schema({
    name: { type: String, required: true }
}, {_id: false});

var Vegetable = new Schema({
    name: { type: String, required: true },
    lastname: String,
    nicknames: [String],
    berries: [Berry],
    embedded: {
        x: String,
        y: String
    },
    related: { type: Schema.ObjectId, ref: 'vegetable' }
});

describe('SchemaGenerator', function () {


    it('should generate string prop correctly', function (done) {
        var property = generator.generateString(Vegetable.paths["name"]);
        console.log(JSON.stringify(property));
        expect(property).to.have.property("type", "string");
        done();
    });
    it('should generate string prop correctly', function (done) {
        var property = generator.generateString(Vegetable.paths["lastname"]);
        console.log(JSON.stringify(property));
        expect(property).to.have.property("type", "string");
        done();
    });
    it('should generate array of string prop correctly', function (done) {
        var property = generator.generateArray(Vegetable.paths["nicknames"]);
        console.log(JSON.stringify(property));
        expect(property).to.have.property("type", "array");
        expect(property.items).to.have.property("type", "string");
        done();
    });
    it('should generate array of objects prop correctly', function (done) {
        var property = generator.generateArray(Vegetable.paths["berries"]);
        console.log(JSON.stringify(property));
        expect(property).to.have.property("type", "array");
        expect(property.items.properties.name).to.have.property("type", "string");
        done();
    });
    it('should generate ObjectId prop correctly', function (done) {
        var property = generator.generateObjectId(Vegetable.paths["related"]);
        console.log(JSON.stringify(property));
        expect(property).to.have.property("type", "ref");
        expect(property).to.have.property("url", "vegetable");
        done();
    });
    it('should find embeddeds', function (done) {
        var embeddeds = generator.findEmbeddeds(Vegetable);
        expect(embeddeds.embedded.length).to.be(2);
        expect(embeddeds.embedded[0]).to.have.property("path","x");
        done();
    });
   it('should generate a Schema correctly', function (done) {
        var schema = generator.generate(Vegetable);
        console.log(JSON.stringify(schema));
        expect(schema.properties._id).to.not.have.property("ref");
        expect(schema.properties.embedded.properties).to.have.property("x");
        expect(Object.keys(schema.properties).length).to.be(7);
        done();
    });
});