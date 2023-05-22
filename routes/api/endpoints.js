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
    description: 'Admin profile',
    tags: ['api']
}

let endpoints = [
	{
		method: ["POST"],
		path: "/update-profile",
		handler: Handlers.update_profile
	},
	
]

internals.endpoints = endpoints.map(r=>{
    return r;
})


module.exports = internals;
