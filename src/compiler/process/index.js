import nested from 'postcss-nested';
import values from 'postcss-values-parser';
import selectors from 'postcss-selector-parser';
import processImport from './import';
import processCustomProperties from './custom-properties';
import processCustomMedia from './custom-media';
import processExtends from './extends';
import processVar from './var';
import processColor from './color';
import processPartition from './partition';
import processExports from './exports';
import processUrl from './url';
import processComposes from './composes';
import processApply from './apply';

export default (root, compilation) => {
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
