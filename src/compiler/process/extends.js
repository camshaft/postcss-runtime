import { formatPath, sheetName } from '../utils';

export default (root, compilation) => {
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

      compilation.import(path, sheetName, rule);
      compilation.moduleImports.set(path, rule);
      compilation.extends.set(path, rule);
      rule.remove();
    }
  });
}
