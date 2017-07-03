const stringify = require('./value');

module.exports = function(compilation, builder, root) {
  const defines = compilation.defines;
  const constants = compilation.constants;

  defines.forEach((define, name) => {
    const c = constants.get(name);
    const decl = define.decl;
    const dependencies = define.dependencies;
    builder(`  $define(${c}, `, decl);
    if (dependencies.size) {
      const args = Array.from(dependencies.values()).join(', ');
      builder(`(${args}) => `);
    }

    builder('`');
    stringify(decl.value, builder);
    builder('`');

    if (dependencies.size) {
      dependencies.forEach((_, key) => {
        builder(`, ${constants.get(key)}`, decl);
      });
    }
    builder(`);\n`, decl);
  });

  if (defines.size) builder('\n');
  else builder('  // no defines\n\n');
};
