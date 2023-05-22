"use strict";

var internals = {};

internals.noscript = function(req, reply) {
  reply.view("noscript.html");
};
internals.error404 = function(req, reply) {
  reply.view("error404.html");
};

module.exports = internals;
