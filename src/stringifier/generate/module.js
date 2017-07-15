const generateStaticNames = require('./static-names');
const generateStaticRules = require('./static-rules');
const generateDefine = require('./define');
const generateAlias = require('./alias');
const generateFactory = require('./factory');
const sheetName = require('../utils').sheetName;

module.exports = function(compilation, builder, root) {
  const prefix = compilation.opts.prefix || 'export';
  builder(`${prefix} function ${sheetName}($createStatic, $generateName, $instance, $define, $alias) {\n`, root);
  [
    generateStaticNames,
    generateStaticRules,
    generateDefine,
    generateAlias,
    generateFactory,
  ].forEach((fun) => {
    fun(compilation, builder, root);
  });
  builder('}', root);
};
