var Moment = require('moment');

var relativeTime = function (varDate) {
  return Moment(varDate).startOf('hour').fromNow();  
};

module.exports = relativeTime;
