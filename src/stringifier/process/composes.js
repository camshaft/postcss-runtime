const sheetName = require('../utils').sheetName;
const formatExport = require('../utils').formatExport;

const isMedia = node =>
  (node.type === "atrule" && node.name === "media") ||
  (node.parent && isMedia(node.parent));

const isComposes = node =>
  node.type === "decl" &&
  (node.prop === "composes" || node.prop === "compose-with");

const isExternal = nodes =>
  nodes[nodes.length - 1].type === 'string' &&
  nodes[nodes.length - 2].type === 'word' &&
  nodes[nodes.length - 2].value === 'from';

const walkRules = (css, callback) =>
  css.walkRules(rule => {
    if (rule.some(node => isComposes(node))) {
      callback(rule);
    }
  });

const walkDecls = (rule, callback) =>
  rule.each(node => {
    if (isComposes(node)) {
      callback(node);
    }
  });

module.exports = function(root, compilation) {
  const exports = compilation.exports;

  walkRules(root, rule => {
    if (isMedia(rule)) {
      // TODO warn
      // result.warn(
      //   "composition cannot be conditional and is not allowed in media queries",
      //   { node: rule }
      // );
      return;
    }

    const classes = [];
    rule.selector.walk((node) => {
      // TODO make sure this is a single class selector
      if (node.type === 'class') classes.push(node.name);
    });

    function formatExternal(names, from) {
      const mod = compilation.import(from, sheetName, rule);
      compilation.moduleImports.set(from, rule);

      names.forEach((name) => {
        if (name.type !== 'word') return;
        const value = formatExport(name.value);

        const location = compilation.import(from, value, rule);

        const node = {
          type: 'external',
          value: location,
          module: mod,
        };

        classes.forEach((cls) => {
          compilation.compose(cls, node);
        });
      });
    }

    function formatInternal(names) {
      names.forEach((name) => {
        if (name.type !== 'word') return;
        const value = name.value;

        const node = exports.has(value) ?
          { type: 'local', value: { toString: () => exports.get(value) } } :
          { type: 'global', value: value };

        classes.forEach((cls) => {
          compilation.compose(cls, node);
        });
      });
    }

    walkDecls(rule, decl => {
      const names = decl.value.nodes[0].nodes.filter((n) => {
        return n.type === 'word' || n.type === 'string';
      });

      if (isExternal(names)) {
        const from = names.pop();
        names.pop(); // from
        formatExternal(names, from.value);
      } else {
        formatInternal(names);
      }

      decl.remove();
    });
  });
}
