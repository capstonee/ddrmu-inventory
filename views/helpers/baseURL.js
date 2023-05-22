var baseURL;

baseURL = function (context) {
    Config = require('../../config');
    return Config.url.local;
};

module.exports = baseURL;

