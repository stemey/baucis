// This is a Controller mixin to add methods for generating Swagger data.

// __Dependencies__
var mongoose = require('mongoose');

// __Private Members__


// A method for capitalizing the first letter of a string
function capitalize(s) {
    if (!s) return s;
    if (s.length === 1) return s.toUpperCase();
    return s[0].toUpperCase() + s.substring(1);
}

// __Module Definition__
var SchemaGenerator = module.exports = function () {
};


// A method used to generate a Swagger model definition for a controller
SchemaGenerator.prototype.generate = function (schema, controller) {

    var definition = {};
    if (controller) {
        definition.id = capitalize(controller.get('singular'));
    }
    definition.properties = this.generateProperties(schema);
    return definition;
}

// Convert a Mongoose type into a Swagger type
SchemaGenerator.prototype.swaggerTypeFor = function (type) {
    if (!type) return null;
    else if (type === String) return 'String';
    if (type === Number) return 'Double';
    if (type === Date) return 'Date';
    if (type === Boolean) return 'Boolean';
    if (type === mongoose.Schema.Types.ObjectId) return 'ObjectId';
    if (type === mongoose.Schema.Types.Oid) return 'Oid';
    if (type === mongoose.Schema.Types.Array) return 'SchemaArray';
    if (Array.isArray(type)) return 'Array';
    if (type === Object) return "Embedded";
    if (type instanceof Object) return "Embedded";
    if (type === mongoose.Schema.Types.Mixed) return null;
    if (type === mongoose.Schema.Types.Buffer) return null;
    throw new Error('Unrecognized type: ' + type);
};

SchemaGenerator.prototype.getEmbeddedName = function (name) {
    var embeddedName
    var paths = name.split(".");
    if (paths.length > 1) {
        embeddedName = paths[0];
    }
    return embeddedName;
}


// Convert a Mongoose type into a Swagger type
SchemaGenerator.prototype.findEmbeddeds = function (schema) {
    var embeddeds = {};
    Object.keys(schema.paths).forEach(function (name) {

        var embeddedName = this.getEmbeddedName(name);
        if (embeddedName) {
            var embedded = embeddeds[embeddedName];
            if (embedded == null) {
                embedded = [];
                embeddeds[embeddedName] = embedded;
            }
            var normalizedPath = {};
            var originalPath = schema.paths[name];
            Object.keys(originalPath).forEach(function (key) {
                normalizedPath[key] = originalPath[key];
            });
            normalizedPath.path = name.substring(embeddedName.length + 1);
            embedded.push(normalizedPath);
        }
    }, this);
    return embeddeds;
}
// A method used to generate a Swagger model definition for a controller
SchemaGenerator.prototype.generateSchema = function (schema) {
    if (schema.paths) {
        var definition = {};
        definition.properties = this.generateProperties(schema);
        return definition;
    } else {
        return this.generateProperty(schema);
    }

}


SchemaGenerator.prototype.generateProperty = function (path, schema) {
    var property = {};
    //var select = controller.get('select');
    var method = "generate" + this.swaggerTypeFor(path.options.type);
    if (typeof this[method] === "function") {
        var property = this[method](path, schema);
    } else {
        // throw new Error("cannot handle type " + path.options.type);
        return undefined;
    }


    return property;
};

SchemaGenerator.prototype.generateProperties = function (schema) {
    var properties = {};
    Object.keys(schema.paths).forEach(function (name) {
        if (!this.getEmbeddedName(name)) {
            var property = this.generateProperty(schema.paths[name], schema);
            properties[name] = property;

            //var mode = select && (select.match(/\b[-]/g) ? 'exclusive' : 'inclusive');
            //var exclusiveNamePattern = new RegExp('\\B-' + name + '\\b', 'gi');
            //var inclusiveNamePattern = new RegExp('(?:\\B[+]|\\b)' + name + '\\b', 'gi');

            // Keep deselected paths private
            //if (path.selected === false) return;

            // TODO is _id always included unless explicitly excluded?

            // If it's excluded, skip this one
            //if (mode === 'exclusive' && select.match(exclusiveNamePattern)) return;
            // If the mode is inclusive but the name is not present, skip this one
            //if (mode === 'inclusive' && name !== '_id' && !select.match(inclusiveNamePattern)) return;

            // Configure the property
            /*property.required = path.options.required;
             property.type = type;

             // Set enum values if applicable
             if (path.enumValues && path.enumValues.length > 0) {
             property.allowableValues = { valueType: 'LIST', values: path.enumValues };
             }

             // Set allowable values range if min or max is present
             if (!isNaN(path.options.min) || !isNaN(path.options.max)) {
             property.allowableValues = { valueType: 'RANGE' };
             }

             if (!isNaN(path.options.min)) {
             property.allowableValues.min = path.options.min;
             }

             if (!isNaN(path.options.max)) {
             property.allowableValues.max = path.options.max;
             }

             if (!property.type) {
             console.log('Warning: That field type is not yet supported in baucis Swagger definitions, using "string."');
             console.log('Path name: %s.%s', definition.id, name);
             console.log('Mongoose type: %s', path.options.type);
             property.type = 'string';
             }*/

            //definition.properties[name] = property;
        }
    }, this);

    var embeddeds = this.findEmbeddeds(schema);
    for (var key in embeddeds) {
        var property = this.generateEmbedded(embeddeds[key]);
        if (property) {
            properties[key] = property;
        }
    }

    return properties;
};

SchemaGenerator.prototype.generateString = function (path, schema) {
    var property = {};
    this.setGeneralProperties(property, path);
    property.type = "string";
    return property;
}

SchemaGenerator.prototype.generateArray = function (path, schema) {
    var property = {};
    this.setGeneralProperties(property, path);
    property.type = "array";
    var method = "generateType" + this.swaggerTypeFor(path.options.type[0]);
    if (typeof this[method] === "function") {
        property.items = this[method](path.options.type[0]);
    }
    return property;
}

SchemaGenerator.prototype.generateObject = function (path, schema) {
    var property = {type: "object"};
    this.setGeneralProperties(property, path);
    // an object of propertiey
    property.type = this.generateSchema(path.options.type[0]);
    return property;
}

SchemaGenerator.prototype.generateEmbedded = function (embedded) {
    var property = {type: "object"};
    var required = false;
    var schema ={paths:{}};
    embedded.forEach(function (path) {
        if (path.options.required === true) {
            required = true;
        }
        schema.paths[path.path]=path;
    });
    property.required = required;
    property.type = "object";
    property.properties=this.generateProperties(schema);
    return property;
}

SchemaGenerator.prototype.generateObjectId = function (path, schema) {
    var property = {};
    if (path.options.ref) {
        this.setGeneralProperties(property, path);
        // an object of propertiey
        property.url = path.options.ref;
        property.type = "ref";
        property.schemaUrl = path.options.ref;
        property.idProperty = "_id";
    } else {
        this.setGeneralProperties(property, path);
        // an object of propertiey
        property.type = "string";
    }
    return property;
}

SchemaGenerator.prototype.generateTypeString = function (type) {
    return {type: "string"};
}

SchemaGenerator.prototype.generateTypeEmbedded = function (type) {
    var schema = this.generate(type);
    schema.type = "object";
    return schema;
}

SchemaGenerator.prototype.setGeneralProperties = function (property, path) {
    property.required = path.options.required;
}



