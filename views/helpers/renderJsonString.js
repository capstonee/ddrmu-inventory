var _ = require('lodash'),
  renderJsonString;

renderJsonString = function (context) {
  if (_.isObject(context))
    return context && !_.isEmpty(context) ? JSON.stringify(context) : '[]';
  return context && context.length ? JSON.stringify(context) : '[]';
};

module.exports = renderJsonString;
