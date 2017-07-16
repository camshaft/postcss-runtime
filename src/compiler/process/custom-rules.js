import postcss from 'postcss';
import nested from 'postcss-nested';
import processRoot from './index';

const RE = /^--/;
const SELECTOR = '__POSTCSS_RUNTIME_SELECTOR__';

export default (node, compilation) => {
  const constants = compilation.constants;
  const customRules = compilation.customRules;

  node.walkRules((rule) => {
    const selector = String(rule.selector);
    if (!RE.test(String(rule.selector))) return;

    const name = selector
      .replace(RE, '')
      .replace(/:$/, '');
    constants.set(name);

    rule.remove();

    let root = postcss.root({ hasVar: true });
    const rootRule = postcss.rule({ selector: SELECTOR });
    root.append(rootRule);

    rule.each((node) => {
      rootRule.append(node);
    });

    const child = compilation.child();

    root = processRoot(root, child);

    root.walkRules((rule) => {
      const selector = rule.selector;
      if (!selector) return;
      selector.walk((node) => {
        if (node.type !== 'tag' && node.type !== SELECTOR) return;
        node.value = '$selector';
        node.unquote = true;
      });
    });

    // TODO check for composes as well
    if (child.exports.size) {
      console.error(`Custom rule "--${name}" cannot export class selectors`);
      return;
    }

    customRules.set(name, {
      root: root,
      reason: rule,
      dependencies: child.dependencies,
    });
  });
};
