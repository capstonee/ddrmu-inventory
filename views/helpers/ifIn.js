var ifIn;

ifIn = function (elem, list, options) {
    if(list.indexOf(elem) > -1) {
        return options.fn(this);
      }
    return options.inverse(this);
};

module.exports = ifIn;
