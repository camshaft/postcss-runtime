import { getLine } from '../utils';

export default (compilation, builder, root) => {
  let i = 0;
  compilation.imports.slice().sort((a, b) => {
    return getLine(a.reason) - getLine(b.reason);
  }).forEach((imp) => {
    const reason = imp.reason;
    const names = imp.names;
    builder('import {\n', reason);
    names.forEach((r, name) => {
      const target = `$import${i++}`;
      names.set(name, target);
      builder(`  ${name} as ${target},\n`, r);
    });
    builder('} from ' + JSON.stringify(imp.path) + ';\n', reason);
  });
  if (i) builder('\n');
  else builder('// no imports\n\n');
};
