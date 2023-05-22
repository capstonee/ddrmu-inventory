var toUpperCharAt = function (val) {
  if(val){
    return val.charAt(0).toUpperCase() + val.slice(1);
  }
};

module.exports = toUpperCharAt;
