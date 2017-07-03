const parser = require('postcss-values-parser');
const formatPath = require('../utils').formatPath;

module.exports = function(root, compilation) {
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

      if (arg.type === 'word' || arg.type === 'string') {
        const url = formatPath(arg.value, compilation.opts.root);
        if (!url) return;
        arg.replaceWith(parser.word({
          unquote: true,
          value: compilation.import(url, 'default', decl),
          source: arg.source,
          sourceIndex: arg.sourceIndex,
        }))
      }
    });
  });
}
