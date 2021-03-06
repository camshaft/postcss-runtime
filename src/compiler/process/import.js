import { formatPath, sheetName } from '../utils';

export default (root, compilation) => {
  root.walkAtRules((rule) => {
    if (rule.name == 'import') {
      const params = rule.params;

      let path;
      try {
        let pathNode = params.nodes[0].nodes[0];
        if (pathNode.type !== 'string') throw pathNode;
        path = formatPath(pathNode.value, compilation.opts.root);
      } catch(e) {
        throw rule.error(`invalid syntax for import: ${params}`, { word: String(params) });
      }

      // TODO support media queries
      // https://developer.mozilla.org/en-US/docs/Web/CSS/@import

      if (path) {
        compilation.import(path, sheetName, rule);
        compilation.moduleImports.set(path, rule);
      } else {
        compilation.cssImports.push(rule);
      }
      rule.remove();
    }
  });
}
