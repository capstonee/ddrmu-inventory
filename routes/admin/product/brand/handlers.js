"use strict";

var internals = {};
const { Brand, Products } = require("@models");

const messageError =
  "/admin/products/brand?message=Error Please try again!&alert=error";
const messageSuccess =
  "/admin/products/brand?message=Successfully Created&alert=success";

internals.index = async function (req, reply) {
  const brand = await Brand.find({}).lean();
  return reply.view("admin/products/brand.html", {
    credentials: req.auth.credentials,
    brand,
  });
};
internals.add = async function (req, reply) {
  try {
    let payload = req.payload;
    const brand = await Brand.create(payload);
    if (!brand) return reply.redirect(messageError);
    return reply.redirect(messageSuccess);
  } catch (err) {
    return reply.redirect(messageError);
  }
};
internals.update = async function (req, reply) {
  let payload = req.payload;
  const brand = await Brand.findOneAndUpdate(
    {
      _id: req.payload._id,
    },
    { $set: payload }
  ).lean();
  if (!brand) return reply.redirect(messageError);
  return reply.redirect(messageSuccess);
};
internals.delete = async function (req, reply) {
  //CANT DELETE BRAND IF BRAND IS USE
  const countBrand = await Products.count({ brand_id: req.params._id }).lean();
  if (countBrand > 0) {
    return reply({ status: false, message: "Brand is used", icon: "error" });
  }
  const brand = await Brand.deleteOne({ _id: req.params._id }).lean();
  if (!brand) {
    return reply({ status: false, message: "Error to delete", icon: "error" });
  }
  return reply({
    status: true,
    message: "Successfully deleted",
    icon: "success",
  });
};
module.exports = internals;
