var momentjs = require("moment");

var moment;

moment = function (date, format) {
  return momentjs(date).format(format);
};

module.exports = moment;
