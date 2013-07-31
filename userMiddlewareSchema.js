// __Dependencies__
var extend = require('util')._extend;

// __Private Members__
var schema = {
  "request":
  { "instance": { "head": [], "get": [], "post": [], "put": [], "del": [] },
   "collection": { "head": [], "get": [], "post": [], "put": [], "del": [] }
  },
  "query":
  { "instance": { "head": [], "get": [], "post": [], "put": [], "del": [] },
   "collection": { "head": [], "get": [], "post": [], "put": [], "del": [] }
  },
  "documents":
  { "instance": { "head": [], "get": [], "post": [], "put": [], "del": [] },
   "collection": { "head": [], "get": [], "post": [], "put": [], "del": [] }
  }
}

// __Module Definition__
module.exports = function () {
  return extend({}, schema);
};
