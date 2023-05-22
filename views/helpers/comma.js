var comma;

comma = function (data) {
  data = parseFloat(data);
  data = data.toFixed(2);
  return data.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

module.exports = comma;
