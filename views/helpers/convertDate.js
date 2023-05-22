var Moment = require('moment');

var convertDate = function (varDate, varFormat) {
  return Moment(varDate).format(varFormat);
};

module.exports = convertDate;
