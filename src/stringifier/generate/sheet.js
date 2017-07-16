const stringifyValue = require('./value');
const stringifySelector = require('./selector');
const escape = require('../utils').escapeCSS;

const generators = {
  atrule(node, builder) {
    const after = node.params ? ' ' : '';
    builder(`@${node.name}${after}`, node);
    if (node.params) stringifyValue(node.params, builder);

    if (node.nodes) {
      this.block(node, builder);
    } else {
      builder(';');
    }
  },

  decl(node, builder) {
    const prop = node.unquote ?
      '${ ' + node.prop + ' }' :
      escape(node.prop);

    builder(`${prop}:`, node);

    stringifyValue(node.value, builder);

    if (node.important) {
      builder(node.raws.important || ' !important', node);
    }

    builder(`;`, node);
  },

  rule(node, builder) {
    stringifySelector(node.selector, builder);
    this.block(node, builder);
  },

  block(node, builder) {
    builder('{', node, 'start');

    if (node.nodes && node.nodes.length) {
      this.body(node, builder);
    }

    builder('}', node, 'end');
  },

  body(node, builder) {
    for ( let i = 0; i < node.nodes.length; i++ ) {
      let child = node.nodes[i];
      stringify(child, builder);
    }
  }
};

function stringify(node, builder) {
  return generators[node.type](node, builder);
};

module.exports = (node, builder) => {
  return stringify(node, builder);
};
