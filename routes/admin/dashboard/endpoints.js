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
    path: "/admin/dashboard",
    handler: Handlers.index,
  },
  {
    method: ["POST"],
    path: "/admin/checkout",
    handler: Handlers.checkout,
  },
  {
    method: ["POST"],
    path: "/admin/qrcode/acceptBorrow",
    handler: Handlers.acceptBorrowQRcode,
  },
];

internals.endpoints = endpoints.map((r) => {
  if (!!r.config) r.config = { ...CONFIG, ...r.config };
  else r.config = { ...CONFIG };
  return r;
});

module.exports = internals;
