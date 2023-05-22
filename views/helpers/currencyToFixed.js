
var currencyToFixed = function (amount) {
  var amountFixed = new Intl.NumberFormat().format(amount);
  return amountFixed
};

module.exports = currencyToFixed;