import parser from 'postcss-values-parser';
import { escapeCSS } from '../utils';

function isParen(arg, value) {
  return arg && arg.type === 'paren' && arg.value === value;
}

function toString(node, parent) {
  parent = parent || {};
  if (parent.unquote && !node.unquote) {
    return JSON.stringify(String(node));
  }
  if (node.unquote && !parent.unquote) {
    const raws = node.raws;
    return [
      raws.before || '',
      '${ ',
      node.value,
      ' }',
      raws.after || '',
    ].join('');
  }

  return escapeCSS(node);
}

function fixUnquoteFunction(node) {
  const nodes = node.nodes;
  const first = nodes[0];

  node.each((c) => {
    if (c.type === 'comma' || c.type == 'paren') c.remove();
  });

  for (let i = nodes.length - 1; i >= 1; i--) {
    node.insertBefore(
      nodes[i],
      parser.comma({ value: ', ', unquote: true })
    );
  }

  if (!isParen(node.first, '(')) {
    node.prepend(parser.paren({ value: '(', unquote: true }));
  }
  if (!isParen(node.last, ')')) {
    node.append(parser.paren({ value: ')', unquote: true }));
  }
}

function scalar(node, builder, parent) {
  builder(toString(node, parent));
}

function container(node, builder) {
  node.each((n, i) => {
    stringify(n, builder, node);
  });
}

const generators = {
  root: container,
  value: container,

  atword: scalar,

  colon: scalar,

  comma: scalar,

  comment(node, builder) {
    // builder(`(/* ${node.value} */ "")`, node);
  },

  func(node, builder, parent) {
    const unquote = node.unquote;
    const raws = node.raws || {};

    if (!parent.unquote && raws.before) {
      builder(raws.before);
    }

    if (unquote) {
      if (!parent.unquote) builder('${ ');
      builder(String(node.value));
      fixUnquoteFunction(node);
      node.each((n) => {
        stringify(n, builder, node);
      });
      if (!parent.unquote) builder(' }');
    } else {
      if (parent.unquote) builder('`');
      builder(String(node.value));
      container(node, builder);
      if (parent.unquote) builder('`');
    }

    if (!parent.unquote && raws.after) {
      builder(raws.after);
    }
  },

  number(node, builder, parent) {
    let value = String(node);

    if (node.unquote && node.unit) value = JSON.stringify(value);
    if (node.unquote && !parent.unquote) value = '${ ' + value + ' }';

    builder(value);
  },

  operator: scalar,

  paren: scalar,

  string(node, builder, parent) {
    let value = String(node);
    if (node.unquote && !parent.unquote) value = '${ ' + value + ' }';
    if (!node.unquote) value = escapeCSS(value);
    builder(value);
  },

  word: scalar,
};

export default function stringify(node, builder, parent) {
  if (!generators[node.type]) console.error(node);
  return generators[node.type](node, builder, parent);
}
