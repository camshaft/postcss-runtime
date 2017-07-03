const generateDynamicNames = require('./dynamic-names');
const generateExpose = require('./expose');
const generateExtends = require('./extends');
const generateDynamicRules = require('./dynamic-rules');
const getLine = require('../utils').getLine;
const sheetName = require('../utils').sheetName;

module.exports = function(compilation, builder, root) {
  // TODO if there are no dynamic, composed, and extended then just return locals

  const moduleImports = compilation.moduleImports;
  const imports = Array
    .from(moduleImports.keys())
    .sort((a, b) => {
      return getLine(moduleImports.get(a)) - getLine(moduleImports.get(b));
    })
    .map((path) => (
      `, ${compilation.getImport(path, sheetName)}`
    ))
    .join('');

  const constants = compilation.constants;
  const dependencies = Array
    .from(compilation.dependencies.keys())
    .map(dep => `, ${constants.get(dep)}`)
    .join('')

  if (!imports && !dependencies && !compilation.exports.size) {
    builder(`  // no factory\n`);
    return;
  }

  // TODO
  builder(`  $factory(($render, $expose${imports}) => {\n`);

  [
    generateDynamicNames,
    generateExtends,
    generateExpose,
    generateDynamicRules,
  ].forEach((fun) => {
    fun(compilation, builder, root);
  });

  builder(`  }${imports}${dependencies});\n`);
};
