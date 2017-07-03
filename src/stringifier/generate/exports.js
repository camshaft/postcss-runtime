const formatExport = require('../utils').formatExport;

module.exports = function(compilation, builder, root) {
  const exports = compilation.exports;
  exports.forEach((v, key) => {
    let name = formatExport(key);
    exports.set(key, name);
    builder(`export const ${name} = ${JSON.stringify(key)};\n`);
  });
  if (exports.size) builder('\n');
  else builder('// no exports\n\n');
};
