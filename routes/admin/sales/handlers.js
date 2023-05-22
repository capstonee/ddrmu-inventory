'use strict';

var internals = {};
const { Users, Sales, Stocks } = require('@models');
const Crypto = require('@lib/Crypto');
const _ = require('lodash');

function getTotal(sales) {
  let totalCost = 0,
    totalPrice = 0;
  sales.map((r) => {
    totalCost += r.cost ? r.cost : 0;
    totalPrice += r.product_id.price ? r.product_id.price : 0;
  });
  return { totalCost, totalPrice };
}

internals.index = async function (req, reply) {
  var condition = {
    status: 'accepted',
  };
  const stocks = await Stocks.find({}).lean();

  let sales = await Sales.find(condition).populate('user_id product_id').lean();

  let members = await Users.countDocuments({ scope: ['client'] });

  const salesConsume = await Sales.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [
              { isAcceptReturn: true },
              { isReturn: true },
              { status: 'accepted' },
            ],
          },
          {
            $and: [{ isReturn: false }, { status: 'accepted' }],
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

  sales = sales
    .map((sale) => {
      if (req?.query?.type != 'all') {
        if (req?.query?.type == 'consumable' && sale?.isReturn) return;
        if (req?.query?.type == 'equipment' && !sale?.isReturn) return;
      }
      stocks.map((s) => {
        salesConsume.map((c) => {
          const consume = s.qty - c.total;

          if (
            String(s.product_id) == String(sale.product_id._id) &&
            String(s.product_id) == String(c._id) &&
            consume > 0
          ) {
            sale.cost = s?.cost;
          }
        });
      });
      return sale;
    })
    .filter((s) => s);

  let viewHtml = 'admin/sales/index.html';
  if (req?.query?.type == 'consumable') {
    viewHtml = 'admin/sales/consumable.html';
  } else if (req?.query?.type == 'equipment') {
    viewHtml = 'admin/sales/equipment.html';
  } else {
  }

  sales = sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return reply.view(viewHtml, {
    credentials: req.auth.credentials,
    totalReturned:
      new Set(sales.map((v) => String(v?.product_id?._id)))?.size || 0,
    totalNonReturned: sales?.filter((v) => !v?.isAcceptReturn)?.length || 0,
    sales,
    members,
    // totalCost: getTotal(sales).totalCost,
    // totalPrice: getTotal(sales).totalPrice,
  });
};

internals.search = async function (req, reply) {
  try {
    let condition = [{}];
    let members = 1;

    let typeFilter = req.payload.product_type;

    if (typeFilter == 'true') typeFilter = true;
    if (typeFilter == 'false') typeFilter = false;
    let type = {
      isReturn: typeFilter,
      isAcceptReturn: typeFilter,
    };

    if (typeFilter == 'all') type = {};

    if (
      !_.isEmpty(req.payload.startDate) &&
      !_.isEmpty(req.payload.endDate) &&
      !_.isEmpty(req.payload.user_id)
    ) {
      let start = new Date(req.payload.startDate);
      let end = new Date(req.payload.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      condition = [
        type,
        { createdAt: { $gte: start, $lt: end } },
        { user_id: req.payload.user_id },
        {
          $or: [
            { $and: [{ status: 'accepted' }, { isReturn: false }] },
            {
              $and: [
                { status: 'accepted' },
                { isReturn: true },
                { isAcceptReturn: true },
              ],
            },
          ],
        },
      ];
    } else if (!_.isEmpty(req.payload.user_id)) {
      condition = [
        type,
        { user_id: req.payload.user_id },
        {
          $or: [
            { $and: [{ status: 'accepted' }, { isReturn: false }] },
            {
              $and: [
                { status: 'accepted' },
                { isReturn: true },
                { isAcceptReturn: true },
              ],
            },
          ],
        },
      ];
    } else if (req.payload.startDate && req.payload.endDate) {
      members = await Users.countDocuments({ scope: ['client'] });
      let start = new Date(req.payload.startDate);
      let end = new Date(req.payload.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      condition = [
        type,
        { createdAt: { $gte: start, $lt: end } },
        {
          $or: [
            { $and: [{ status: 'accepted' }, { isReturn: false }] },
            {
              $and: [
                { status: 'accepted' },
                { isReturn: true },
                { isAcceptReturn: true },
              ],
            },
          ],
        },
      ];
    } else if (!_.isEmpty(req.payload.startDate)) {
      members = await Users.countDocuments({ scope: ['client'] });
      let start = new Date(req.payload.startDate);
      var today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(23, 59, 59, 999);

      condition = [
        type,
        { createdAt: { $gte: start, $lt: today } },
        {
          $or: [
            { $and: [{ status: 'accepted' }, { isReturn: false }] },
            {
              $and: [
                { status: 'accepted' },
                { isReturn: true },
                { isAcceptReturn: true },
              ],
            },
          ],
        },
      ];
    }
    const stocks = await Stocks.find({}).lean();

    let sales = await Sales.find({
      $and: condition,
    })
      .populate('user_id product_id')
      .lean();

    const salesConsume = await Sales.aggregate([
      {
        $match: {
          $or: [
            {
              $and: [
                { isAcceptReturn: true },
                { isReturn: true },
                { status: 'accepted' },
              ],
            },
            {
              $and: [{ isReturn: false }, { status: 'accepted' }],
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

    sales = sales.map((sale) => {
      stocks.map((s) => {
        salesConsume.map((c) => {
          const consume = s.qty - c.total;

          if (
            String(s.product_id) == String(sale.product_id._id) &&
            String(s.product_id) == String(c._id) &&
            consume > 0
          ) {
            sale.cost = s.cost;
          }
        });
      });
      return sale;
    });

    const totalSales = async () => {
      var condition = {
        status: 'accepted',
      };
      const stocks = await Stocks.find({}).lean();

      let sales = await Sales.find(condition)
        .populate('user_id product_id')
        .lean();

      let members = await Users.countDocuments({ scope: ['client'] });

      const salesConsume = await Sales.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [
                  { isAcceptReturn: true },
                  { isReturn: true },
                  { status: 'accepted' },
                ],
              },
              {
                $and: [{ isReturn: false }, { status: 'accepted' }],
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

      sales = sales.map((sale) => {
        stocks.map((s) => {
          salesConsume.map((c) => {
            const consume = s.qty - c.total;

            if (
              String(s.product_id) == String(sale.product_id._id) &&
              String(s.product_id) == String(c._id) &&
              consume > 0
            ) {
              sale.cost = s.cost;
            }
          });
        });
        return sale;
      });
      return {
        totalReturned:
          new Set(sales.map((v) => String(v?.product_id?._id)))?.size || 0,
        totalNonReturned: sales?.filter((v) => !v.isAcceptReturn)?.length || 0,
      };
    };

    let viewHtml = 'admin/sales/index.html';

    if (!req?.payload?.type) {
      if (req?.query?.product_type == 'consumable')
        viewHtml = 'admin/sales/consumable.html';
      else if (req?.query?.product_type == 'equipment')
        viewHtml = 'admin/sales/equipment.html';
    }

    sales = sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return reply.view(viewHtml, {
      credentials: req.auth.credentials,
      sales,
      members,
      totalCost: getTotal(sales).totalCost,
      totalPrice: getTotal(sales).totalPrice,
      totalReturned: req.payload.totalReturned,
      totalNonReturned: req.payload.totalNonReturned,
      startDate: new Date(req.payload.startDate),
      endDate: req.payload.endDate,
    });
  } catch (err) {}
};
module.exports = internals;
