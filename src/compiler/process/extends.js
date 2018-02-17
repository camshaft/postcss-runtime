import { formatPath, sheetName } from '../utils';

export default (root, compilation) => {
  const {
    moduleImports,
    'extends': ext,
    messages
  } = compilation;
  root.walkAtRules((rule) => {
    if (rule.name == 'extends') {
      const params = rule.params;

      let path;
      try {
        let pathNode = params.nodes[0].nodes[0];
        if (pathNode.type !== 'string') throw pathNode;
        path = formatPath(pathNode.value, compilation.opts.root);
      } catch(e) {
        throw rule.error(`invalid syntax for extends: ${params}`, { word: String(params) });
      }

      if (!ext.has(path)) {
        messages.push({
          type: 'postcss-runtime-extend',
          path
        });
      }

      compilation.import(path, sheetName, rule);
      moduleImports.set(path, rule);
      ext.set(path, rule);
      rule.remove();
    }
  });
}
