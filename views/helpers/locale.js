var locale;

locale = function (data) {
  if (data) {
    return data.toLocaleString("en-US");
  } else {
    return 0;
  }
};

module.exports = locale;
