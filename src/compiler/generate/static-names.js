export default (compilation, builder, root) => {
  let i = 0;
  const exports = compilation.exports;
  const staticNames = compilation.staticNames;
  staticNames.forEach((v, name) => {
    const vname = `$staticName${i++}`;
    staticNames.set(name, vname);
    const exp = exports.get(name);
    builder(`  const ${vname} = $generateName(${exp});\n`);
  });
  if (i) builder('\n');
  else builder('  // no static names\n\n');
};
