const formatExport = require('../utils').formatExport;

module.exports = function(compilation, builder, root) {
  const exports = compilation.exports;
  const extend = compilation.extends;

  // TODO figure out how to export everything except the $ function
  // extend.forEach((reason, path) => {
  //   builder(`export * from ${JSON.stringify(path)};\n`, reason);
  // });

  exports.forEach((v, key) => {
    let name = formatExport(key);
    exports.set(key, name);
    builder(`export const ${name} = ${JSON.stringify(key)};\n`);
  });

  if (exports.size || extend.size) builder('\n');
  else builder('// no exports\n\n');
};
