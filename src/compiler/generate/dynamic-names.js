export default (compilation, builder, root) => {
  let i = 0;
  const exports = compilation.exports;
  const dynamicNames = compilation.dynamicNames;
  dynamicNames.forEach((v, name) => {
    const vname = `$dynamicName${i++}`;
    dynamicNames.set(name, vname);
    const exp = exports.get(name);
    builder(`    const ${vname} = $generateName(${exp});\n`);
  });
  if (i) builder('\n');
  else builder('    // no dynamic names\n\n');
};
