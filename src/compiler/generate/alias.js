import stringify from './value';

export default (compilation, builder, root) => {
  const aliases = compilation.aliases;
  const constants = compilation.constants;

  aliases.forEach((source, target) => {
    const s = constants.get(source);
    const t = constants.get(target);
    builder(`  $alias(${s}, ${t});\n`);
  });

  if (aliases.size) builder('\n');
  else builder('  // no aliases\n\n');
};
