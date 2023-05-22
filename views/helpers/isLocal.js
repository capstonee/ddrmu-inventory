var isLocal;



isLocal = function (context) {
    if(process.env.NODE_ENV === 'amazon'){
      return context.inverse(this);
    }
    else {
      return context.fn(this);
    }
};

module.exports = isLocal;
