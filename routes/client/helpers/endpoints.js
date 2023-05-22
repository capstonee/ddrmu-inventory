"use strict";
/**
 * ## Imports
 *
 */
//Handle the endpoints
var Handlers = require("./handlers"),
  internals = {};

const CONFIG = {
  auth: {
    strategy: "standard",
    scope: ["client"],
  },
  tags: ["api"],
};

let endpoints = [
  {
    method: ["GET"],
    path: "/helpers/products",
    handler: Handlers.getProduct,
  },
  {
    method: ["GET"],
    path: "/helpers/sales",
    handler: Handlers.getSales,
  },
];

internals.endpoints = endpoints.map((r) => {
  if (!!r.config) r.config = { ...CONFIG, ...r.config };
  else r.config = { ...CONFIG };
  return r;
});

module.exports = internals;
