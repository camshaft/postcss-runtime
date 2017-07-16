const nested = require('postcss-nested');
const values = require('postcss-values-parser');
const selectors = require('postcss-selector-parser');

const processImport = require('./import');
const processCustomProperties = require('./custom-properties');
const processCustomMedia = require('./custom-media');
const processExtends = require('./extends');
const processVar = require('./var');
const processColor = require('./color');
const processPartition = require('./partition');
const processExports = require('./exports');
const processUrl = require('./url');
const processComposes = require('./composes');
const processApply = require('./apply');

module.exports = (root, compilation) => {
  // un-nest selectors
  nested()(root);

  root.walk((node) => {
    switch (node.type) {
      case 'atrule':
        if (node.params) {
          node.params = values(node.params, { loose: true })
            .parse();
        }
        break;
      case 'rule':
        if (node.selector) {
          node.selector = selectors()
            .process(node.selector, { lossless: true })
            .res;
        }
        break;
      case 'decl':
        if (node.value) {
          node.value = values(node.value, { loose: true })
            .parse();
        }
        break;
      case 'comment':
        node.remove();
        break;
    }
  });

  [
    processColor,
    processUrl,
    processCustomProperties,
    processCustomMedia,
    processExtends,
    processImport,
    processVar,
    processApply,
    processPartition,
    processExports,
    processComposes,
  ].forEach((fun) => {
    root = fun(root, compilation) || root;
  });

  root.walk((node) => {
    const { nodes } = node;
    if (nodes && nodes.length === 0) node.remove();
  });

  return root;
}
