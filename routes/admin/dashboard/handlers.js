'use strict';

var internals = {};
const { Users, Sales, Stocks } = require('@models');
const { isNil } = require('lodash');
const _ = require('lodash');
const mongoose = require('mongoose');

internals.index = async function (req, reply) {
  const cntUser = await Users.countDocuments({ scope: ['client'] });

  const getStocks = await Stocks.find({}).populate('product_id');
  const getSales = await Sales.find({}).populate('product_id');
  let consumable = 0;
  let totalSales = 0;
  getStocks.map((r) => {
    if (r.product_id.isReturn == false) {
      consumable += r.qty;
    }
  });
  getSales.map((r) => {
    if (r.product_id.isReturn == false && r.status == 'accepted') {
      totalSales += r.qty;
    }
  });

  let remaining = 0;
  let totalSalesRemaining = 0;
  getStocks.map((r) => {
    if (r.product_id.isReturn == true) {
      remaining += r.qty;
    }
  });
  getSales.map((r) => {
    if (r.product_id.isReturn == true && r.status == 'accepted') {
      totalSalesRemaining += r.qty;
    }
  });

  const pickups = await Sales.aggregate([
    {
      $match: {
        status: 'pickup',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: '$user_id',
        status: { $first: '$status' },
        user: { $first: '$user' },
        note: { $first: '$note' },
        updatedAt: { $first: '$updatedAt' },
        items: {
          $push: {
            productId: '$product_id',
            isReturn: '$isReturn',
            qty: '$qty',
          },
        },
      },
    },
  ]);

  return reply.view('admin/dashboard/index.html', {
    credentials: req.auth.credentials,
    cntUser,
    consumable: consumable - totalSales,
    remainingStocks: remaining - totalSalesRemaining,
    pickups,
  });
};

internals.checkout = async function (req, reply) {
  if (_.isNil(req.payload)) {
    return reply({ message: 'Error invalid sales', type: 'danger' });
  }

  const productId = await Sales.find({
    _id: { $in: req.payload.map((v) => v._id) },
  }).select('product_id');

  const stocks = await Stocks.aggregate([
    {
      $match: {
        product_id: {
          $in: productId.map((v) => mongoose.Types.ObjectId(v.product_id)),
        },
      },
    },
    {
      $group: {
        _id: '$product_id',
        total: { $sum: '$qty' },
      },
    },
  ]);

  const consumedSales = await Sales.aggregate([
    {
      $match: {
        product_id: {
          $in: productId.map((v) => mongoose.Types.ObjectId(v.product_id)),
        },
        status: { $in: ['accepted', 'pending'] },
      },
    },
    {
      $group: {
        _id: '$product_id',
        total: { $sum: '$qty' },
      },
    },
  ]);

  // check stocks balance before proceeding
  const hasEnoughStocks = stocks?.some((stock) => {
    let sale = consumedSales?.find((s) => String(s?._id) == String(stock?._id));

    if (!isNil(sale)) {
      let remainingStocks = stock?.total - sale?.total;
      return Number.isFinite(remainingStocks) && remainingStocks >= 0;
    }
    return false;
  });

  if (!hasEnoughStocks) {
    return reply({ message: 'Insufficient stocks', type: 'error' });
  }

  req.payload.map(async (r) => {
    await Sales.update(
      { _id: r._id },
      {
        $set: {
          qty: r.qty,
          status: r.status == 'cancel' ? 'cancel' : 'pickup',
          returnDate: r.returnDate ? r.returnDate : null,
          approve_date: new Date(),
          approve_time: new Date().toLocaleTimeString('en-PH', {
            hour12: true,
          }),
        },
      },
      { new: true }
    );
  });
  return reply({ message: 'sucessfully accepted', type: 'success' });
};

internals.acceptBorrowQRcode = async function (req, reply) {
  try {
    let { returnDate } = req.payload;
    returnDate = new Date(returnDate);
    let dateToday = new Date().toString();
    dateToday = dateToday.split(' ');
    dateToday = dateToday[4].split(':');
    returnDate.setHours(dateToday[0], dateToday[1], dateToday[2]);

    await Sales.findOneAndUpdate(
      {
        product_id: req.payload.product_id,
        user_id: req.payload.user_id,
        status: 'pending',
        isAcceptReturn: false,
      },
      {
        $set: {
          returnDate,
        },
      },
      {
        new: true,
      }
    );

    return reply.redirect(
      '/admin/dashboard?message=Sucessfully accepted!!&alert=success'
    );
  } catch (err) {
    return reply.redirect(
      '/admin/dashboard?message=Error invalid QR code!!&alert=error'
    );
  }
};

module.exports = internals;
