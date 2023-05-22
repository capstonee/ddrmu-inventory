'use strict';

var internals = {};
const { Products, Brand, Category, Unit, Stocks, Sales } = require('@models');
const Image = require('@lib/Image');
const _ = require('lodash');
const { remove } = require('lodash');
const messageError =
  '/admin/products?message=Error Please try again!&alert=error';
const messageSuccess =
  '/admin/products?message=Successfully Created&alert=success';
const util = require('util');

internals.getProduct = async function (req, reply) {
  let products = await Products.find({})
    .populate('category_id brand_id unit_id')
    .lean();

  const stocks = await Stocks.aggregate([
    { $match: {} },
    {
      $group: {
        _id: '$product_id',
        total: { $sum: '$qty' },
      },
    },
    { $sort: { total: 1 } },
  ]);

  const salesConsume = await Sales.aggregate([
    // {
    //   $match: {
    //     $or: [
    //       {
    //         $and: [
    //           { isAcceptReturn: true },
    //           { isReturn: true },
    //           { status: "accepted" },
    //         ],
    //       },
    //       {
    //         $and: [{ isReturn: false }, { status: "accepted" }],
    //       },
    //     ],
    //   },
    // },
    {
      $match: { status: { $ne: 'cancel' }, isAcceptReturn: false },
    },
    {
      $group: {
        _id: '$product_id',
        total: { $sum: '$qty' },
      },
    },
  ]);

  products.map((r) => {
    let total;
    stocks.map((s) => {
      if (String(r._id) == String(s._id)) return (total = s.total);
    });
    salesConsume.map((s) => {
      if (String(s._id) == String(r._id)) {
        total = total - s.total;
      }
    });

    if (_.isNil(total)) total = 0;
    return (r.total = total);
  });

  products = products.filter((r) => r.total > 0);
  return reply(products);
};

internals.getSales = async function (req, reply) {
  let sales = await Sales.find({ user_id: req.auth.credentials._id })
    .populate({
      path: 'product_id',
      populate: [
        {
          path: 'brand_id',
          model: 'brand',
        },
        {
          path: 'category_id',
          model: 'category',
        },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  return reply(sales);
};
module.exports = internals;
