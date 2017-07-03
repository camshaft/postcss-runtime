const sheetName = require('../utils').sheetName;

module.exports = function(compilation, builder, root) {
  const extend = compilation.extends;
  extend.forEach((reason, path) => {
    builder(`    $expose(${compilation.getImport(path, sheetName)});\n`, reason);
  });
  if (extend.size) builder('\n');
  else builder('    // no extends\n\n');
};
