export default (compilation, builder, root) => {
  const {
    exports,
    staticNames,
    dynamicNames,
    composes,
  } = compilation;

  function generateDependencies(name) {
    if (staticNames.has(name)) builder(`, ${staticNames.get(name)}`);
    if (dynamicNames.has(name)) builder(`, ${dynamicNames.get(name)}`);
    if (composes.has(name)) {
      composes.get(name).forEach((node) => {
        switch (node.type) {
          case 'global':
            builder(`, ${JSON.stringify(node.value)}`);
            break;
          case 'local':
            generateDependencies(String(node.value));
            break;
          case 'external':
            builder(`, ${String(node.module)}.get(${node.value})`);
            break;
        }
      });
    }
  }

  exports.forEach((name, key) => {
    builder(`    $expose(${name}`);
    generateDependencies(key);
    builder(');\n');
  });
  if (exports.size) builder('\n');
  else builder('    // no exposes\n\n');
};
