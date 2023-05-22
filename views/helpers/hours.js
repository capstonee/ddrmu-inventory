var hours;

hours = function (seconds) {
  if (seconds) {
    var date = new Date(null);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8);
  }
};

module.exports = hours;
