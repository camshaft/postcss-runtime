import { escapeCSS } from '../utils';

function container(delim) {
  return (node, builder) => {
    node.each((n, i) => {
      if (i && delim) builder(delim, n);
      stringify(n, builder);
    });
  }
}

function join(arr) {
  return arr
    .filter(v => v)
    .join('');
}

function toString(node) {
  if (!node.value) return null;
  let value = String(node.value);
  if (node.unquote) value = '${ ' + value + ' }';
  else value = escapeCSS(value);
  return value;
}

function trim(space) {
  space
    .replace(/\n/g, '')
    .replace(/\s+/g, ' ');
}

function createScalar(prefix, suffix) {
  return (node, builder) => {
    const spaces = node.spaces;
    builder(join([
      trim(spaces.before),
      node.ns,
      prefix,
      toString(node),
      suffix,
      trim(spaces.after),
    ]));
  };
}

const scalar = createScalar();

const generators = {
  root: container(','),
  selector: container(''),

  attribute(node, builder) {
    const spaces = node.spaces;

    const selector = [
      spaces.before,
      '[',
      node.ns,
      node.attribute,
    ];

    if (node.operator) selector.push(node.operator);

    selector.push(toString(node));

    if (node.raws.insensitive) {
      selector.push(node.raws.insensitive);
    } else if (node.insensitive) {
      selector.push(' i');
    }
    selector.push(']');

    builder(join(selector));
  },

  'class': createScalar('.'),

  combinator: scalar,

  comment(node, builder) {
    // builder(`/* ${node.value} */ "")`, node);
  },

  id: createScalar('#'),

  namespace: scalar,

  pseudo(node, builder) {
    if (!node.length) return scalar(node, builder);
    const spaces = node.spaces;
    builder(spaces.before + toString(node) + '(');
    // TODO what delimeter should we use here?
    container('')(node, builder);
    builder(`)${spaces.after}`);
  },

  string: scalar,

  tag: scalar,

  universal: scalar,
};

export default function stringify(node, builder) {
  return generators[node.type](node, builder);
}
