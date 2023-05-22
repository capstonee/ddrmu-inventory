"use strict";

var internals = {};
const { Products, Supplier, Stocks } = require("@models");

const messageError =
  "/admin/products/supplier?message=Error Please try again!&alert=error";
const messageSuccess =
  "/admin/products/supplier?message=Successfully Created&alert=success";

internals.index = async function (req, reply) {
  const supplier = await Supplier.find({}).lean();
  return reply.view("admin/products/supplier.html", {
    credentials: req.auth.credentials,
    supplier,
  });
};
internals.add = async function (req, reply) {
  try {
    let payload = req.payload;
    const supplier = await Supplier.create(payload);
    if (!supplier) return reply.redirect(messageError);
    return reply.redirect(messageSuccess);
  } catch (err) {
    return reply.redirect(messageError);
  }
};
internals.update = async function (req, reply) {
  let payload = req.payload;
  const supplier = await Supplier.findOneAndUpdate(
    {
      _id: req.payload._id,
    },
    { $set: payload }
  ).lean();
  if (!supplier) return reply.redirect(messageError);
  return reply.redirect(messageSuccess);
};
internals.delete = async function (req, reply) {
  //CANT DELETE SUPPLIER IF SUPPLIER IS USE
  const countUnit = await Stocks.count({ supplier_id: req.params._id }).lean();
  if (countUnit > 0) {
    return reply({
      status: false,
      message: "This supplier is used",
      icon: "error",
    });
  }
  const supplier = await Supplier.deleteOne({ _id: req.params._id }).lean();
  if (!supplier) {
    return reply({ status: false, message: "Error to delete", icon: "error" });
  }
  return reply({
    status: true,
    message: "Successfully deleted",
    icon: "success",
  });
};
module.exports = internals;
