// __Module Definition__

// A function that returns a hash with an HTTP verb entry for each stage and "howMany"
module.exports = function () {
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
  };
  return schema;
};
