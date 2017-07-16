const formatVar = require('../utils').formatVar;
const RE = /^--/;

module.exports = (node, compilation) => {
  const constants = compilation.constants;
  const dependencies = compilation.dependencies;

  node.walkAtRules((rule) => {
    if (rule.name !== 'apply') return;

    const name = String(rule.params)
      .replace(RE, '')
      .replace(/:$/, '');

    const ccName = formatVar(name);

    dependencies.set(name, ccName);
    constants.set(name);

    rule.hasVar = true;
    rule.apply = name;
  });
};
