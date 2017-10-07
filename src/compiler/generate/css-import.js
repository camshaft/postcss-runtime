import { getLine } from '../utils';

export default (compilation, builder, root) => {
  const { cssImports } = compilation;

  if (cssImports.length) {
    builder('  $cssImport(\n')
    cssImports.slice().sort((a, b) => {
      return getLine(a) - getLine(b);
    }).forEach((rule) => {
      let { value } = rule.params.nodes[0].nodes[0];
      builder(`    ${JSON.stringify(value)},\n`, rule);
    });
    builder('  );\n\n');
  } else {
    builder('// no css imports\n\n');
  }
};
