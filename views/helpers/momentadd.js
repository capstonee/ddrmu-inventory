var momentjs = require("moment");

var momentadd;

momentadd = function (date, len) {
  return momentjs(date).add(len,'days').format('YYYY-MM-DD');
};

module.exports = momentadd;
