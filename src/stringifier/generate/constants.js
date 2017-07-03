module.exports = function(compilation, builder, root) {
  let i = 0;
  const constants = compilation.constants;
  constants.forEach((v, value) => {
    const name = `$const${i++}`;
    constants.set(value, name);
    builder(`const ${name} = ${JSON.stringify(value)};\n`);
  });
  if (i) builder('\n');
  else builder('// no constants\n\n');
};
