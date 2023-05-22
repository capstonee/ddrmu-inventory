var momentjs = require("moment");

var momentsub;

momentsub = function (date, len) {
  return momentjs(date).subtract(len,'days').format('YYYY-MM-DD');
};

module.exports = momentsub;
