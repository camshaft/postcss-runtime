module.exports = function(root, compilation) {
  const dynamicNames = compilation.dynamicNames;
  const staticNames = compilation.staticNames;
  const exports = compilation.exports;

  // TODO setup selector scoping

  root.walkRules((rule) => {
    const names = rule.hasVar ? dynamicNames : staticNames;
    rule.selector.walk((node) => {
      if (node.type === 'class' && node.scope !== 'global') {
        const name = node.value;

        names.set(name, null);
        exports.set(name);
        node.unquote = true;

        function value() {
          const v = names.get(name);
          if (typeof v === 'string') return v;
          throw new Error(`Uninitialized export: ${JSON.stringify(name)}`);
        }
        value.toString = value;
        node.value = value;
        node.name = name;
      }
    });
  });
}
