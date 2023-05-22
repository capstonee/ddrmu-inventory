'use strict';

var internals = {};
const { Users, Sales, Stocks } = require('@models');
const _ = require('lodash');

internals.index = async function (req, reply) {
  const cntUser = await Users.countDocuments({ scope: ['client'] });
  const stocks = await Stocks.aggregate([
    { $match: {} },
    {
      $group: {
        _id: null,
        total: { $sum: '$qty' },
      },
    },
  ]);

  const sales = await Sales.aggregate([
    { $match: { status: { $ne: 'cancel' } } },
    {
      $group: {
        _id: null,
        total: { $sum: '$qty' },
      },
    },
  ]);

  return reply.view('admin/returnItem/index.html', {
    credentials: req.auth.credentials,
    cntUser,
    remainingStocks: isNaN(stocks[0]?.total)
      ? 0
      : isNaN(sales[0]?.total)
      ? stocks[0]?.total
      : stocks[0]?.total - sales[0]?.total,
  });
};

internals.acceptReturnItem = async function (req, reply) {
  var today = new Date();
  if (_.isNil(req.params._id)) {
    return reply({ message: 'Error invalid sales', type: 'danger' });
  }
  await Sales.update(
    { _id: req.params._id },
    {
      $set: {
        isAcceptReturn: true,
        dateReturn: today,
        timeReturn: new Date().toLocaleTimeString('en-PH', { hour12: true }),
        equipmentStatus: req.query?.equipmentStatus || '',
      },
    }
  );
  return reply({ message: 'sucessfully accepted', type: 'success' });
};

internals.acceptReturnItemQRcode = async function (req, reply) {
  try {
    var today = new Date();
    var equipmentStatus = req?.payload?.equipmentStatus || '';

    const sales = await Sales.findOneAndUpdate(
      {
        product_id: req.payload.product_id,
        user_id: req.payload.user_id,
        status: 'accepted',
        isAcceptReturn: false,
      },
      {
        $set: {
          isAcceptReturn: true,
          dateReturn: today,
          timeReturn: new Date().toLocaleTimeString('en-PH', { hour12: true }),
          equipmentStatus,
        },
      },
      { new: true }
    ).lean();
    if (!sales) {
      return reply.redirect(
        '/admin/return-item?message=User or product not found!!&alert=error'
      );
    }
    return reply.redirect(
      '/admin/return-item?message=Sucessfully accepted!!&alert=success'
    );
  } catch (err) {
    return reply.redirect(
      '/admin/return-item?message=Error invalid QR code!!&alert=error'
    );
  }
};

internals.pickUp = async function (req, reply) {
  const { userId, name, pickupAt } = req.payload;
  const pickUpDate = new Date(pickupAt);
  // let dateToday = new Date().toString();
  // dateToday = dateToday.split(' ');
  // dateToday = dateToday[4].split(':');
  // pickUpDate.setHours(dateToday[0], dateToday[1], dateToday[2]);

  await Sales.updateMany(
    { user_id: userId, status: 'pickup' },
    {
      $set: {
        pickUpName: name,
        pickUpDate,
        pickUpTime: new Date().toLocaleTimeString('en-PH', { hour12: true }),
        status: 'accepted',
      },
    }
  );
  return reply.redirect('/admin/dashboard?message=Success&alert=success');
};
module.exports = internals;
