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

internals.index = async function (req, reply) {
  let type = req.query.type;
  if (type == 'remaining') type = { isReturn: true };
  else if (type == 'consumable') type = { isReturn: false };
  else type = {};

  const brand = await Brand.find({}).lean();
  const category = await Category.find({}).lean();
  const unit = await Unit.find({}).lean();

  let products = await Products.find(type)
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
  products.map((r) => {
    let total;
    stocks.map((s) => {
      if (String(r._id) == String(s._id)) {
        return (total = s.total);
      }
    });
    r.total = total;
    return r.total ? r.total : (r.total = 0);
  });

  let condition = {
    $or: [
      {
        status: 'accepted',
        isAcceptReturn: false,
        isReturn: true,
      },
      {
        status: 'accepted',
        isReturn: false,
      },
    ],
  };
  let rawProducts = await Sales.aggregate([
    {
      $match: condition,
    },
    {
      $group: {
        _id: '$product_id',
        total: { $sum: '$qty' },
      },
    },
  ]).sort({ total: -1 });
  products = products.map((p) => {
    let total = 0,
      con = false;
    rawProducts.map((r) => {
      if (String(p._id) == String(r._id)) {
        total = p.total - r.total;
        con = true;
      }
    });
    if (con) {
      p.total = total;
    }
    return p;
  });

  return reply.view('admin/products/list.html', {
    credentials: req.auth.credentials,
    products,
    brand,
    category,
    unit,
  });
};
internals.add = async function (req, reply) {
  try { 
    let {name, code}= req.payload;
    let payload = {
      name: name.toUpperCase(),
      price: req.payload.price,
      category_id: req.payload.category_id,
      brand_id: req.payload.brand_id,
      unit_id: req.payload.unit_id,
      code: code,
      isReturn: req.payload.isReturn == 'true' ? true : false,
    };

    const getCode = await Products.findOne({code});
    if(getCode) return reply.redirect('/admin/products?message=Code already exist&alert=error');


    const product = await Products.create(payload);
    if (!product) return reply.redirect(messageError);
    //add product image
    if (!_.isEmpty(req.payload.img)) {
      Image.upload(req.payload.img, product._id);
      await Products.update(
        { _id: product._id },
        { $set: { img: `/assets/images/products/${product._id}.jpg` } }
      );
    }
    return reply.redirect(messageSuccess);
  } catch (err) {
    return reply.redirect(messageError);
  }
};
internals.update = async function (req, reply) {
  let {name, code, _id}= req.payload;
  let payload = {
    name: name.toUpperCase(),
    category_id: req.payload.category_id,
    brand_id: req.payload.brand_id,
    unit_id: req.payload.unit_id,
    code: code,
    isReturn: req.payload.isReturn == 'true' ? true : false,
  };

  const getCode = await Products.findOne({_id:{$ne:_id},code});
    if(getCode) return reply.redirect('/admin/products?message=Code already exist&alert=error');

  const product = await Products.findOneAndUpdate(
    {
      _id: req.payload._id,
    },
    { $set: payload }
  ).lean();
  if (!product) return reply.redirect(messageError);
  //add product image
  if (!_.isEmpty(req.payload.img)) {
    Image.upload(req.payload.img, product._id);
    await Products.update(
      { _id: product._id },
      { $set: { img: `/assets/images/products/${product._id}.jpg` } }
    );
  }
  return reply.redirect(messageSuccess);
};
internals.delete = async function (req, reply) {
  //CANT DELETE PRODUCT IF PRODUCT HAS STOCKS
  const countStocks = await Stocks.countDocuments({
    product_id: req.params._id,
  }).lean();
  if (countStocks > 0) {
    return reply({ status: false, message: 'Error to delete', icon: 'error' });
  }
  Image.remove(`/assets/images/products/${req.params._id}.jpg`);
  const brand = await Products.deleteOne({ _id: req.params._id }).lean();
  if (!brand) {
    return reply({ status: false, message: 'Error to delete', icon: 'error' });
  }
  return reply({
    status: true,
    message: 'Successfully deleted',
    icon: 'success',
  });
};

module.exports = internals;
