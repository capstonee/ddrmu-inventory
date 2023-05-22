"use strict";

var internals = {};
const { Category, Products } = require("@models");

const messageError =
  "/admin/products/category?message=Error Please try again!&alert=error";
const messageSuccess =
  "/admin/products/category?message=Successfully Created&alert=success";

internals.index = async function (req, reply) {
  const category = await Category.find({}).lean();
  return reply.view("admin/products/category.html", {
    credentials: req.auth.credentials,
    category,
  });
};
internals.add = async function (req, reply) {
  try {
    let payload = req.payload;
    const category = await Category.create(payload);
    if (!category) return reply.redirect(messageError);
    return reply.redirect(messageSuccess);
  } catch (err) {
    return reply.redirect(messageError);
  }
};
internals.update = async function (req, reply) {
  let payload = req.payload;
  const category = await Category.findOneAndUpdate(
    {
      _id: req.payload._id,
    },
    { $set: payload }
  ).lean();
  if (!category) return reply.redirect(messageError);
  return reply.redirect(messageSuccess);
};
internals.delete = async function (req, reply) {
  //CANT DELETE CATEGORY IF CATEGORY IS USE
  const countCategory = await Products.count({
    category_id: req.params._id,
  }).lean();
  if (countCategory > 0) {
    return reply({ status: false, message: "Category is used", icon: "error" });
  }
  const category = await Category.deleteOne({ _id: req.params._id }).lean();
  if (!category) {
    return reply({ status: false, message: "Error to delete", icon: "error" });
  }
  return reply({
    status: true,
    message: "Successfully deleted",
    icon: "success",
  });
};
module.exports = internals;
