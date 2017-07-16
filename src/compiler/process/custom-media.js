import parser from 'postcss-values-parser';
import { parse as parseVar } from './var';
import { mergeRaws } from '../utils';

const RE = /^--/;

function getAlias(rule) {
  if (!rule.hasVar) return;
  const root = rule.params.nodes[0].nodes[0];
  if (root.type === 'word' && root.orig) return root.orig;
}

function prepareVars(rule) {
  const vars = [];

  rule.params.walk((node) => {
    const value = node.value;

    if (!value || !RE.test(value)) return;
    vars.push(node);
  });

  function removeParen(sibling, fun) {
    if (sibling.type === 'paren') {
      fun.raws = mergeRaws(fun, sibling);
      sibling.remove();
    }
  }

  vars.forEach((node) => {
    var fun = parser.func({
      value: 'var',
      parent: node.parent,
    });
    fun.append(parser.paren({value: '('}));
    fun.append(node.clone());
    fun.append(parser.paren({value: ')'}));

    node.replaceWith(fun);

    const nodes = fun.parent.nodes;
    const index = nodes.indexOf(fun);

    removeParen(nodes[index + 1], fun);
    removeParen(nodes[index - 1], fun);
  })
}

export default (node, compilation) => {
  const constants = compilation.constants;
  const defines = compilation.defines;
  const aliases = compilation.aliases;

  function use(rule, deps) {
    prepareVars(rule);

    parseVar(rule, constants, deps);

    return deps;
  }

  function define(rule) {
    const params = rule.params.nodes[0].nodes;

    const first = params[0];

    if (!RE.test(first.value || '')) return;

    first.remove();

    params[0].raws.before = '';

    const name = first.value.replace(RE, '');
    constants.set(name);

    const dependencies = use(rule, new Map());

    const alias = getAlias(rule);
    if (alias) {
      aliases.set(name, alias);
    } else {
      defines.set(name, {
        reason: rule,
        dependencies: dependencies,
      });
    }

    rule.remove();
  }

  node.walkAtRules((rule) => {
    if (rule.name === 'custom-media') return define(rule);
    if (rule.name === 'media') return use(rule, compilation.dependencies);
  });
};
