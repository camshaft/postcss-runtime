const camelcase = require('camelcase');
const mergeRaws = require('../utils').mergeRaws;

exports = module.exports = (node, compilation) => {
  const constants = compilation.constants;
  const dependencies = compilation.dependencies;
  node.walkDecls((decl) => {
    exports.parse(decl, constants, dependencies);
  });
};

exports.parse = (decl, constants, dependencies) => {
  const vars = [];

  const value = decl.value || decl.params;
  if (!value) return;

  value.walk((fun) => {
    if (fun.type === 'func' && fun.value === 'var') {
      vars.push(fun);
      decl.hasVar = true;
    }
  });

  vars.forEach((fun) => {
    const args = [];
    fun.each((arg) => {
      if (arg.type !== 'paren' && arg.type !== 'comma') args.push(arg);
    })
    const name = args[0];
    if (!name && name.type !== 'word') return;
    const formattedName = name.value.replace(/^--/, '');
    const ccName = '$' + camelcase(`var${name.value}`) + '';
    dependencies.set(formattedName, ccName);
    constants.set(formattedName);

    // TODO handle fallbacks

    fun.replaceWith(name.clone({
      unquote: true,
      value: ccName,
      orig: formattedName,
      raws: mergeRaws(fun, name),
    }));
  })
};
