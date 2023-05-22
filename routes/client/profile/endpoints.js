"use strict";
/**
 * ## Imports
 *
 */
//Handle the endpoints
var Handlers = require("./handlers"),
  internals = {};
const Image = require("@lib/Image");

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
    path: "/client/profile",
    handler: Handlers.index,
  },
  {
    method: ["POST"],
    path: "/client/profile/update",
    handler: Handlers.update,
  },
  {
    method: ["POST"],
    path: "/client/profile/upload",
    handler: Handlers.upload,
  },
];

internals.endpoints = endpoints.map((r) => {
  if (!!r.config) r.config = { ...CONFIG, ...r.config };
  else r.config = { ...CONFIG };
  return r;
});

module.exports = internals;
