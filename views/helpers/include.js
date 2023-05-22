var include;
var moment = require('moment');

include = function (array, key) {
  if (Array.isArray(array)) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].mode === key) {
        return moment(array[i].time).format('hh:mm:ss A');
      }
    }
  } else {
    return '';
  }
};

module.exports = include;
