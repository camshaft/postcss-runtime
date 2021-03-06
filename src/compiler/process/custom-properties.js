import { parse as parseVar } from './var';

const RE = /^--/;

function getAlias(decl) {
  if (!decl.hasVar) return;
  const root = decl.value.nodes[0].nodes[0];
  if (root.type === 'word' && root.orig) return root.orig;
}

export default (node, compilation) => {
  const constants = compilation.constants;
  const defines = compilation.defines;
  const aliases = compilation.aliases;

  node.walkDecls((decl) => {
    if (!RE.test(decl.prop)) return;
    const name = decl.prop.replace(RE, '');
    constants.set(name);

    const dependencies = new Map();
    parseVar(decl, constants, dependencies);

    const alias = getAlias(decl);
    if (alias) {
      aliases.set(name, alias);
    } else {
      defines.set(name, {
        reason: decl,
        dependencies: dependencies,
      });
    }

    decl.remove();
  });
};
