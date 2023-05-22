var appinfo;

appinfo = function (context) {
    Config = require('../../config');

    if (context === 'title') {
        return Config.app.title;
    }

};

module.exports = appinfo;
