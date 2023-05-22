"use strict";

var internals = {};
const { Products, Stocks, Sales } = require("@models");

internals.index = async function (req, reply) {
  let products = await Products.find({})
    .populate("category_id brand_id unit_id")
    .lean();
  const stocks = await Stocks.aggregate([
    { $match: {} },
    {
      $group: {
        _id: "$product_id",
        total: { $sum: "$qty" },
      },
    },
    { $sort: { total: 1 } },
  ]);
  products.map((r) => {
    let total;
    stocks.map((s) => {
      if (String(r._id) == String(s._id)) {
        return (total = s.total);
      }
    });
    return (r.total = total);
  });
  return reply.view("client/dashboard/index.html", {
    credentials: req.auth.credentials,
    products,
  });
};
internals.addToCart = async (req, reply) => {
  const client_id = req.auth.credentials._id;
  let payload = req.payload;
  payload.map(async (product) => {
    product.user_id = client_id;
    await Sales.create(product);
  });
  return reply({ message: "sucessfully add", type: "success" });
};
module.exports = internals;
