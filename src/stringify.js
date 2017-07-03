const Stringifier = require('./stringifier');

module.exports = function(node, builder) {
  const str = new Stringifier(builder);
  str.stringify(node);
};
