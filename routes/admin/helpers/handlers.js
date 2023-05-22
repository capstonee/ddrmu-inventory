'use strict';

var internals = {};
const {
  Products,
  Brand,
  Category,
  Unit,
  Stocks,
  Sales,
  Users,
} = require('@models');
const Image = require('@lib/Image');
const _ = require('lodash');
const { remove, map } = require('lodash');
const messageError =
  '/admin/products?message=Error Please try again!&alert=error';
const messageSuccess =
  '/admin/products?message=Successfully Created&alert=success';
const util = require('util');

internals.getProduct = async function (req, reply) {
  let products = await Products.findOne({ _id: req.params._id })
    .populate('category_id brand_id unit_id')
    .lean();
  return reply(products);
};

internals.getSales = async function (req, reply) {
  try {
    let cntPending = 0;
    let allSales = [];
    let cntCustomerReturnItem = 0;
    let lastNote = '';
    let sales = await Users.aggregate([
      {
        $lookup: {
          from: 'sales',
          localField: '_id',
          foreignField: 'user_id',
          pipeline: [
            {
              $lookup: {
                from: 'products',
                localField: 'product_id',
                foreignField: '_id',
                pipeline: [
                  {
                    $lookup: {
                      from: 'units',
                      localField: 'unit_id',
                      foreignField: '_id',
                      as: 'unit_id',
                    },
                  },
                  {
                    $lookup: {
                      from: 'brands',
                      localField: 'brand_id',
                      foreignField: '_id',
                      as: 'brand_id',
                    },
                  },
                  {
                    $lookup: {
                      from: 'categories',
                      localField: 'category_id',
                      foreignField: '_id',
                      as: 'category_id',
                    },
                  },
                  {
                    $lookup: {
                      from: 'stocks',
                      localField: '_id',
                      foreignField: 'product_id',
                      pipeline: [
                        { $match: {} },
                        {
                          $group: {
                            _id: '$product_id',
                            total: { $sum: '$qty' },
                          },
                        },
                      ],
                      as: 'stocks',
                    },
                  },
                ],
                as: 'product_id',
              },
            },
          ],
          as: 'salesDb',
        },
      },
    ]);

    sales
      .filter((f) => {
        if (!_.isEmpty(f.salesDb)) {
          return true;
        } else {
          return false;
        }
      })
      .map(function (r) {
        let salesDb = [];
        let total = 0;
        let createdAt = '';
        let cntCustomerIsReturn = false;
        let cntCustomerPending = false;
        let returnItems = false;

        //GET ONLY ACCEPTED SALES STATUS AND IS RETURN TRUE
        if (req.params.status == 'accepted' && req.params.isReturn == 'true') {
          returnItems = true;
        }
        //PUSH SELECTED CUSTOMER AND SALES
        r.salesDb
          .filter((rs) => {
            if (
              rs.status == req.params.status &&
              rs.isReturn == returnItems &&
              req.params.status == 'accepted' &&
              req.params.isReturn == 'true'
            ) {
              // console.log("ACCEPTED AND ISRETURN TRUE");
              return true;
            } else if (rs.status == req.params.status) {
              // console.log("ALL PENDING OR ACCEPTED");
              return true;
            } else {
              return false;
            }
          })
          .map((s) => {
            //console.log(s);
            if (
              req.params.status == 'accepted' &&
              s.isReturn == true &&
              req.params.isReturn == 'true' &&
              s.isAcceptReturn == false
            ) {
              pushSalesDB();
              //CNT CUSTOMER IF SALES IS RETURN TRUE AND ACCEPTED SALES.
              if (s.isReturn == true) {
                cntCustomerIsReturn = true;
              }
            }

            if (req.params.isReturn == 'all' && s.isAcceptReturn == false) {
              pushSalesDB();
              cntCustomerPending = true;
            }

            function pushSalesDB() {
              s.note ? (lastNote = s.note) : '';
              salesDb.push({
                _id: s._id,
                status: s.status,
                qty: s.qty,
                note: s.note,
                returnDate: s.returnDate,
                product_id: s.product_id[0]._id,
                img: s.product_id[0].img,
                name: s.product_id[0].name,
                pickUpName: s.pickUpName,
                pickUpDate: s.pickUpDate,
                pickUpTime: new Date().toLocaleTimeString('en-PH', {
                  hour12: true,
                }),
                price: s.product_id[0].price,
                price: s.product_id[0].price,
                isReturn: s.product_id[0].isReturn,
                brand: s.product_id[0].brand_id[0].name,
                unit: s.product_id[0].unit_id[0].name,
                category: s.product_id[0].category_id[0].name,
                stocks: s.product_id[0].stocks[0].total,
              });
              total += s.qty * s.product_id[0].price;
              createdAt = s.createdAt;
            }
          });
        //COUNT ACCEPTED CUSTOMER WITH IS RETURN TRUE
        if (cntCustomerIsReturn) {
          cntCustomerReturnItem += 1;
        }
        //COUNT PENDING CUSTOMER
        if (req.params.status == 'pending' && cntCustomerPending) {
          cntPending++;
        }

        if (!_.isEmpty(salesDb)) {
          allSales.push({
            userId: r._id,
            firstName: r.firstname,
            lastName: r.lastname,
            email: r.email,
            phoneNumber: r.phoneNumber,
            profile_img: r.profile_img,
            salesDb: salesDb,
            total: total,
            createdAt: createdAt,
            note: lastNote,
          });
        }

        return r;
      });

    const consumedSales = await Sales.aggregate([
      { $match: { status: { $ne: 'cancel' } } },
      {
        $group: {
          _id: '$product_id',
          total: { $sum: '$qty' },
        },
      },
    ]);

    const remainingStocks = allSales.map((v) => {
      return {
        ...v,
        salesDb: v.salesDb.map((s) => {
          let fd = consumedSales.find(
            (g) => String(g._id) == String(s.product_id)
          );
          if (fd) return { ...s, stocks: s.stocks - fd.total };
          return { ...s };
        }),
      };
    });
    return reply({
      allSales: remainingStocks,
      cntPending,
      cntCustomerReturnItem,
    });
  } catch (e) {
    return;
  }
};

internals.getTotalSales = async function (req, reply) {
  var start = new Date();
  var end = new Date();
  let grandTotal = 0;
  let totalStocks = 0;
  let products = [];
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  let condition = {
    status: 'accepted',
  };
  if (req.params.date != 'all') {
    condition.createdAt = { $gte: start, $lt: end };
  }

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

  rawProducts = rawProducts.map(async (r) => {
    const product = await Products.findOne({ _id: r._id })
      .populate('category_id brand_id unit_id')
      .lean();
    if (product) {
      r.qty = r.total;
      r.subTotal = product.price * r.total;
      grandTotal += r.subTotal;
      totalStocks += r.total;
      r.product_id = product._id;
      r.name = product.name;
      r.img = product.img;
      r.price = product.price;
      r.category = product.category_id.name;
      r.brand = product.brand_id.name;
      r.unit = product.unit_id.name;
    }
    return r;
  });
  rawProducts = await Promise.allSettled(rawProducts);
  rawProducts.map((r) => {
    products.push(r.value);
  });
  return reply({ products: products.slice(0, 5), grandTotal, totalStocks });
};

internals.getAllUser = async function (req, reply) {
  let users = Users.find({ scope: ['client'] }).lean();
  return reply(users);
};
module.exports = internals;
