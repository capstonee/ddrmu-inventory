'use strict';
/**
 * ## Imports
 *
 */
//Handle the endpoints
var Handlers = require('./handlers'),
    internals = {};

internals.endpoints = [
  {
    method: [ 'GET', 'POST' ],
    path: '/noscript',
    handler: Handlers.noscript,
    config: {
      description: 'noscript',
      tags: ['api'],
    }
  },
  {
    method: [ 'GET', 'POST' ],
    path: '/{any*}',
    handler: Handlers.error404,
    config: {
      description: '404',
      tags: ['api'],
    }
  }]

module.exports = internals;
