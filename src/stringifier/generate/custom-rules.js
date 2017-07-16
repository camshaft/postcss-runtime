const stringify = require('./sheet');

module.exports = function(compilation, builder, root) {
  const customRules = compilation.customRules;
  const constants = compilation.constants;

  customRules.forEach((rule, name) => {
    const c = constants.get(name);
    const reason = rule.reason;
    const dependencies = rule.dependencies;
    builder(`  $define(${c}, `, reason);
    if (dependencies.size) {
      const args = Array.from(dependencies.values()).join(', ');
      builder(`(${args}) => `);
    }

    builder('($inject, $selector) => {$inject(\n');
    rule.root.each((node, i) => {
      if (i) builder(',\n    `');
      else builder('    `');
      stringify(node, builder);
      builder('`');
    });
    // stringify(reason.value || reason.params, builder);
    builder('\n  )}');

    if (dependencies.size) {
      dependencies.forEach((_, key) => {
        builder(`, ${constants.get(key)}`, reason);
      });
    }
    builder(`);\n`, reason);
  });

  if (customRules.size) builder('\n');
  else builder('  // no custom rules\n\n');
};
