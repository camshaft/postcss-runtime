import stringify from './value';

export default (compilation, builder, root) => {
  const defines = compilation.defines;
  const constants = compilation.constants;

  defines.forEach((define, name) => {
    const c = constants.get(name);
    const reason = define.reason;
    const dependencies = define.dependencies;
    builder(`  $define(${c}, `, reason);
    if (dependencies.size) {
      const args = Array.from(dependencies.values()).join(', ');
      builder(`(${args}) => `);
    }

    builder('`');
    stringify(reason.value || reason.params, builder);
    builder('`');

    if (dependencies.size) {
      dependencies.forEach((_, key) => {
        builder(`, ${constants.get(key)}`, reason);
      });
    }
    builder(`);\n`, reason);
  });

  if (defines.size) builder('\n');
  else builder('  // no defines\n\n');
};
