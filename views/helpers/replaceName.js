var replaceName = function (fname, email) {
  if (fname) {
    return fname;
  }
  return email;
};

module.exports = replaceName;
