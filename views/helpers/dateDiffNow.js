var Moment = require('moment');

dateDiffNow = function (varDate) {
  return Moment().diff(varDate, 'years');
};

module.exports = dateDiffNow;
