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
    scope: ["admin"],
  },
  tags: ["api"],
};

let endpoints = [
  {
    method: ["GET"],
    path: "/get/product/{_id}",
    handler: Handlers.getProduct,
  },
  {
    method: ["GET"],
    path: "/get/sales/{status}/{isReturn}",
    handler: Handlers.getSales,
  },
  {
    method: ["GET"],
    path: "/get/total/sales/{date}",
    handler: Handlers.getTotalSales,
  },
  {
    method: ["GET"],
    path: "/get/all-user",
    handler: Handlers.getAllUser,
  },
];

internals.endpoints = endpoints.map((r) => {
  if (!!r.config) r.config = { ...CONFIG, ...r.config };
  else r.config = { ...CONFIG };
  return r;
});

module.exports = internals;
