import parser from 'postcss-values-parser';
import { formatPath } from '../utils';

export default (root, compilation) => {
  root.walkDecls((decl) => {
    decl.value.walk((node) => {
      if (node.type !== 'func' || node.value !== 'url') return;
      const arg = node.nodes[1];

      // support variable urls
      if (arg.type === 'word' && /^--/.test(arg.value)) {
        const varArg = node.clone({ value: 'var' });
        node.removeAll();
        node.append(parser.paren({ value: '(' }));
        node.append(varArg);
        node.append(parser.paren({ value: ')' }));
        return;
      }

      if (arg.type === 'func' && arg.value === 'var') {
        return;
      }

      const path = node.nodes.slice(1, -1).map(n => (
        n.type === 'string' ?
          n.value :
          String(n)
      )).join('');

      const url = formatPath(path, compilation.opts.root);
      if (!url) return;

      node.removeAll();

      node.append(parser.paren({ value: '(' }));
      node.append(parser.word({
        unquote: true,
        value: compilation.import(url, 'default', decl),
        source: arg.source,
        sourceIndex: arg.sourceIndex,
      }));
      node.append(parser.paren({ value: ')' }));
    });
  });
}
