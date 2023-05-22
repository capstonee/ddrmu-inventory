"use strict";

var internals = {};
const { Sales } = require("@models");

internals.index = async function (req, reply) {
  return reply.view("client/products/index.html", {
    credentials: req.auth.credentials,
  });
};
internals.remove = async function (req, reply) {
  const sales = await Sales.remove({ _id: req.params._id }).lean();
  if (!sales) {
    return reply({ status: false, message: "Error to delete", icon: "error" });
  }
  return reply({
    status: true,
    message: "Successfully deleted",
    icon: "success",
  });
};
module.exports = internals;
