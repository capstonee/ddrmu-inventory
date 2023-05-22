'use strict';

var internals = {};
const { Products, Supplier, Stocks, Sales } = require('@models');
const messageError =
  '/admin/stocks?message=Error Please try again!&alert=error';
const messageSuccess =
  '/admin/stocks?message=Successfully Created&alert=success';

internals.index = async function (req, reply) {
  const products = await Products.find({}).populate('unit_id').lean();
  const supplier = await Supplier.find({}).lean();
  const stocks = await Stocks.find({})
    .populate('product_id supplier_id')
    .lean();
  return reply.view('admin/stocks/index.html', {
    credentials: req.auth.credentials,
    products,
    supplier,
    stocks,
  });
};
internals.add = async function (req, reply) {
  let payload = req.payload;

  let inc = 1;

  const productInc = await Stocks.findOne(
    { product_id: payload.product_id },
    { inc: 1 }
  )
    .sort({ inc: -1 })
    .lean();

  if (productInc?.inc) inc += productInc.inc;

  payload.inc = inc;

  const stock = await Stocks.create(payload);
  if (!stock) return reply.redirect(messageError);
  return reply.redirect(messageSuccess);
};
internals.update = async function (req, reply) {
  let payload = req.payload;
  const stock = await Stocks.findOneAndUpdate(
    { _id: req.params._id },
    { $set: payload }
  );
  if (!stock) return reply.redirect(messageError);
  return reply.redirect(messageSuccess);
};
internals.delete = async function (req, reply) {
  const stockInfo = await Stocks.findOne({
    _id: req.params._id,
  }).lean();

  const stock = await Stocks.aggregate([
    {
      $match: {
        product_id: stockInfo.product_id,
      },
    },
    {
      $group: {
        _id: '$product_id',
        total: { $sum: '$qty' },
      },
    },
  ]);

  const sales = await Sales.aggregate([
    {
      $match: {
        $and: [
          {
            product_id: stockInfo.product_id,
          },
          {
            status: 'accepted',
          },
        ],
      },
    },
    {
      $group: {
        _id: '$product_id',
        total: { $sum: '$qty' },
      },
    },
  ]);

  const stockTotal = parseInt(stock.qty - stockInfo.qty);
  if (sales > stockTotal) {
    return reply({ status: false, message: 'Stocks is used', icon: 'error' });
  }

  await Stocks.deleteOne({ _id: req.params._id }).lean();
  return reply({
    status: true,
    message: 'Successfully deleted',
    icon: 'success',
  });
};
module.exports = internals;
