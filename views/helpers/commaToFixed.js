var commaToFixed;

commaToFixed = function (data) {
  if (data) {
    data = parseFloat(data);
    data = data.toFixed(2);
    return data.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  } else {
    return 0;
  }
};

module.exports = commaToFixed;
