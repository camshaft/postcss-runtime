const RE = /^--/;

module.exports = (node, compilation) => {
  const constants = compilation.constants;
  const defines = compilation.defines;

  node.walkRules((rule) => {
    const selector = String(rule.selector);
    if (!RE.test(String(rule.selector))) return;
    const name = selector.replace(RE, '');
    constants.set(name);
    console.log('UNHANDLED CUSTOM RULE', name);

    // const dependencies = new Map();
    // parseVar(decl, constants, dependencies);

    // defines.set(name, {
    //   decl: decl,
    //   dependencies: dependencies,
    // });

    rule.remove();
  });
};
