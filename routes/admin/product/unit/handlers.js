"use strict";

var internals = {};
const { Brand, Products, Unit } = require("@models");

const messageError =
  "/admin/products/unit?message=Error Please try again!&alert=error";
const messageSuccess =
  "/admin/products/unit?message=Successfully Created&alert=success";

internals.index = async function (req, reply) {
  const unit = await Unit.find({}).lean();
  return reply.view("admin/products/unit.html", {
    credentials: req.auth.credentials,
    unit,
  });
};
internals.add = async function (req, reply) {
  try {
    let payload = req.payload;
    const unit = await Unit.create(payload);
    if (!unit) return reply.redirect(messageError);
    return reply.redirect(messageSuccess);
  } catch (err) {
    return reply.redirect(messageError);
  }
};
internals.update = async function (req, reply) {
  let payload = req.payload;
  const unit = await Unit.findOneAndUpdate(
    {
      _id: req.payload._id,
    },
    { $set: payload }
  ).lean();
  if (!unit) return reply.redirect(messageError);
  return reply.redirect(messageSuccess);
};
internals.delete = async function (req, reply) {
  //CANT DELETE BRAND IF BRAND IS USE
  const countUnit = await Products.count({ unit_id: req.params._id }).lean();
  if (countUnit > 0) {
    return reply({ status: false, message: "Unit is used", icon: "error" });
  }
  const unit = await Unit.deleteOne({ _id: req.params._id }).lean();
  if (!unit) {
    return reply({ status: false, message: "Error to delete", icon: "error" });
  }
  return reply({
    status: true,
    message: "Successfully deleted",
    icon: "success",
  });
};
module.exports = internals;
