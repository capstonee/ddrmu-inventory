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
          scope: ['admin']
        },
        tags: ['api']
}

let endpoints = [
	{
		method: ["GET"],
		path: "/admin/products",
		handler: Handlers.index
	},
  {
		method: ["POST"],
		path: "/admin/products/add",
		handler: Handlers.add
	},
  {
		method: ["POST"],
		path: "/admin/products/update",
		handler: Handlers.update
	},
	{
		method: ["POST"],
		path: "/admin/products/delete/{_id}",
		handler: Handlers.delete
	},
]

internals.endpoints = endpoints.map(r=>{
    if(!!r.config) r.config = {...CONFIG, ...r.config}
    else r.config = {...CONFIG}
    return r;
})


module.exports = internals;
