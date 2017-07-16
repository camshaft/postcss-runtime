function nested(node) {
  if (node.hasVar) return [node];

  const nodes = [];
  let current;
  node.each((child) => {
    select(child).forEach((result) => {
      if (!current || current.hasVar !== result.hasVar) {
        current = node.clone({ nodes: [], hasVar: result.hasVar });
        nodes.push(current);
      }
      current.append(result);
    });
  });
  return nodes;
}

const selectors = {
  atrule: nested,
  rule: nested,
  decl(node) {
    return [node];
  },
  root(node) {
    const clone = node.clone({ nodes: [] });
    node.each((child) => {
      select(child).forEach(n => clone.append(n));
    });
    return clone;
  }
}

function select(node) {
  if (node.type === 'comment') {
    node.remove();
    return [];
  }
  return selectors[node.type](node);
};

module.exports = select;
