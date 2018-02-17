export default (root, compilation) => {
  const {
    dynamicNames,
    staticNames,
    exports: exp,
    messages,
  } = compilation;

  // TODO setup selector scoping

  root.walkRules((rule) => {
    const names = rule.hasVar ? dynamicNames : staticNames;
    rule.selector.walk((node) => {
      if (node.type === 'class' && node.scope !== 'global') {
        const name = node.value;

        names.set(name, null);
        if (!exp.has(name)) {
          messages.push({
            type: 'postcss-runtime-export',
            name
          });
        }
        exp.set(name);
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
