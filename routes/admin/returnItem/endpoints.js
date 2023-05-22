'use strict';
/**
 * ## Imports
 *
 */
//Handle the endpoints
var Handlers = require('./handlers'),
  internals = {};

const CONFIG = {
  auth: {
    strategy: 'standard',
    scope: ['admin'],
  },
  tags: ['api'],
};

let endpoints = [
  {
    method: ['GET'],
    path: '/admin/return-item',
    handler: Handlers.index,
  },
  {
    method: ['POST'],
    path: '/admin/accept-return-item/{_id}',
    handler: Handlers.acceptReturnItem,
  },
  {
    method: ['POST'],
    path: '/admin/qrcode/acceptReturnItem',
    handler: Handlers.acceptReturnItemQRcode,
  },
  {
    method: ['POST'],
    path: '/admin/return-item/pick-up',
    handler: Handlers.pickUp,
  },
];

internals.endpoints = endpoints.map((r) => {
  if (!!r.config) r.config = { ...CONFIG, ...r.config };
  else r.config = { ...CONFIG };
  return r;
});

module.exports = internals;
