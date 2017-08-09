import { hasIntersection } from '@statechart/util-set';
import createStyle from './style';

function mapToObj(map) {
  const obj = {};
  map.forEach((value, name) => {
    obj[name] = value;
  });
  return obj;
}

export default function createSheet(theme, backend, generateName) {
  const cache = new Map();
  const vars = new Map();
  const templates = [];

  function addImport($, name) {
    if (cache.has($)) return cache.get($);
    const tmpl = createStyle($, generateName(name), addImport);
    templates.push(tmpl);
    cache.set($, tmpl);
    tmpl.vars.forEach((fn, varName) => {
      vars.set(varName, fn);
    });
    return tmpl;
  }

  Object
    .keys(theme)
    .forEach(k => {
      const tmpl = addImport(theme[k].$, k);
      tmpl.name = k;
    });

  let scopes = [];

  function render() {
    const rules = [];

    for (let i = 0; i < templates.length; i++) {
      const tmpl = templates[i];

      const scopeRules = [];
      for (let j = 0; j < scopes.length; j++) {
        const scope = scopes[j];
        const ruleSet = scope.rules.get(tmpl);
        if (ruleSet) {
          rules.push(...(ruleSet[-1] || []));
          scopeRules.push(ruleSet);
        }
      }

      const statics = tmpl.statics;
      for (let j = 0; j < statics.length; j++) {
        const style = statics[j];
        rules.push(...style);
        for (var k = 0; k < scopeRules.length; k++) {
          rules.push(...(scopeRules[k][j] || []));
        }
      }
    }

    backend(rules);
  }

  function createScope(parents, locals = new Map()) {
    const keys = new Set(locals.keys());
    const selectAll = locals.size === 0 || !scopes.length;
    const instances = new Map();
    const exports = {};

    const renderFns = templates
      .filter(tmpl => selectAll || hasIntersection(tmpl.dependencies, keys))
      .map(tmpl => {
        const deps = tmpl.imports.map(i => instances.get(i));
        const i = tmpl.init(deps);

        instances.set(tmpl, i);

        const name = tmpl.name;
        if (name) {
          exports[name] = mapToObj(i.exports);
        }

        return {
          tmpl,
          render: i.render
        };
      });

    const scope = { };
    scopes.push(scope);

    function renderScope() {
      // TODO compute variables
      const values = new Map([...parents, ...locals]);
      const cache = new Map();
      const rules = scope.rules = new Map();

      for (let i = 0; i < renderFns.length; i++) {
        const { tmpl, render } = renderFns[i];
        const ruleSet = render(values, cache);
        rules.set(tmpl, ruleSet);
      }

      setImmediate(render);
    }

    renderScope();

    const children = [];

    return {
      exports,

      createScope(child) {
        // TODO merge parents with locals
        const scope = createScope(locals, child);
        children.push(scope);
        return scope;
      },

      update($locals) {
        locals = $locals || locals;
        renderScope();
      },

      remove() {
        children.forEach(c => c.remove());
        scopes = scopes.filter(s => s !== scope);
        render();
      },
    };
  }

  return createScope.bind(null, vars);
}
