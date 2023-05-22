var ifStatement;

ifStatement = function (v1, v2, options) {
    if(String(v1) == String(v2)) {
        return options.fn(this);
      }
      return options.inverse(this);
};

module.exports = ifStatement;
