import { formatExport } from '../utils';

export default (compilation, builder, root) => {
  const {
    exports,
    extends: ext
  } = compilation

  // TODO figure out how to export everything except the $ function
  // extend.forEach((reason, path) => {
  //   builder(`export * from ${JSON.stringify(path)};\n`, reason);
  // });

  exports.forEach((v, key) => {
    let name = formatExport(key);
    exports.set(key, name);
    builder(`export const ${name} = ${JSON.stringify(key)};\n`);
  });

  if (exports.size || ext.size) builder('\n');
  else builder('// no exports\n\n');
};
