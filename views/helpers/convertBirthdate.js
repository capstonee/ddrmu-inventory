var Moment = require('moment');

var convertBirthdate = function (varDate) {

  date = new Date(varDate);
  year = date.getFullYear();
  month = date.getMonth()+1;
  dt = date.getDate();

    if (dt < 10) {
      dt = '0' + dt;
    }
    if (month < 10) {
      month = '0' + month;
    }
  var x = year+'-' + month + '-'+dt;
  return x;
};

module.exports = convertBirthdate;
