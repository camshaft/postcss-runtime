import { hasIntersection } from '@statechart/util-set';
import createStyle from './style';

function mapToObj(map) {
  const obj = {};
  map.forEach((value, name) => {
    obj[name] = value;
  });
  return obj;
}

function mergeVars(acc, vars) {
  // TODO merge based on priority
  vars.forEach((value, key) => {
    if (!acc.has(key)) acc.set(key, value);
  });
  return acc;
}

export default function createSheet(backend, generateName) {
  const templates = [];
  const modules = new Map();
  const cssImports = [];

  function add(vars, $, name) {
    let template = modules.get($);
    if (!template) {
      template = createStyle($, generateName(name), add.bind(null, vars));
      if (name) template.name = name;
      modules.set($, template);
      templates.push(template);
    }
    template.vars.forEach((fn, varName) => {
      vars.set(varName, fn);
    });
    template.cssImports.forEach((i) => {
      cssImports.push(`@import ${JSON.stringify(i)};\n`);
    });
    return template;
  }

  function addModules(modules) {
    const vars = new Map();
    const tmpls = new Set();
    Object
      .keys(modules)
      .forEach(k => {
        const template = add(vars, modules[k].$, k);
        tmpls.add(template);
      });
    return [tmpls, vars];
  }

  function instantiate(overrides, tmpls, parentScope) {
    const keys = new Set(overrides.keys());
    const instances = new Map();
    const exports = Object.assign({}, parentScope.exports);

    function init(template) {
      const { imports, name } = template;

      const deps = imports.map(i => instances.get(i) || parentScope._get(i));
      const i = template.init(deps);

      instances.set(template, i);

      if (name) exports[name] = mapToObj(i.exports);

      return [
        template,
        i.render,
      ];
    }

    // TODO make this more efficient by selecting applicable templates only
    const renderFns = templates.map(init);

    function render(acc, values, cache) {
      for (let i = 0; i < renderFns.length; i++) {
        const [ template, render ] = renderFns[i];
        const result = render(values, cache);
        let results = acc.get(template);
        if (!results) {
          results = [];
          acc.set(template, results);
        }
        results.push(result);
      }
    }

    return [
      exports,
      render,
      instances,
    ];
  }

  function createScope(parentScope, overrides, modules) {
    let childScopes = [];
    const childRules = new Map();
    let shouldPropagate = true;

    const [ tmpls, tmplVars ] = addModules(modules);
    const [ exports, render, instances ] = instantiate(overrides, tmpls, parentScope);

    // tell children to render
    function _render() {
      shouldPropagate = false;
      for (let i = 0, l = childScopes.length; i < l; i++) {
        childScopes[i].render();
      }
      shouldPropagate = true;
      propagate();
    }

    // a child is telling us to update
    function _set(childScope, childRender, childVars) {
      childRules.set(childScope, [childRender, childVars]);
      if (shouldPropagate) return propagate();
    }

    function _get(template) {
      return instances.get(template) || parentScope._get(template);
    }

    function propagate() {
      const renderers = [ render ];
      const vars = new Map();

      for (let i = childScopes.length - 1; i > -1; i--) {
        const [childRender, childVars] = childRules.get(childScopes[i]);
        renderers.push(...childRender);
        mergeVars(vars, childVars);
      }
      mergeVars(vars, overrides);
      mergeVars(vars, tmplVars);

      parentScope._set(scope, renderers, vars);
    }

    const scope = {
      exports,
      render: _render,
      _set,
      _get,

      createScope(childOverrides, modules) {
        const child = createScope(
          scope,
          childOverrides || new Map(),
          modules || {},
        );
        childScopes.push(child);
        return child;
      },

      update($overrides) {
        overrides = $overrides || overrides;
        _render();
      },

      removeScope(childScope) {
        childRules.delete(childScope);
        childScopes = childScopes.filter(s => s !== childScope);
      },

      remove() {
        parentScope.removeScope(scope);
        // TODO remove all of the children
        // TODO remove any of the unused modules
      },
    };

    return scope;
  }

  function renderRoot(scopes) {
    const rules = cssImports.slice();
    const tmpls = templates.slice().sort(({ priority: a }, { priority: b }) => a - b);

    for (let i = 0; i < tmpls.length; i++) {
      const template = tmpls[i];
      const templateRules = scopes.get(template);

      for (let j = 0; j < templateRules.length; j++) {
        const scopeRules = templateRules[j];
        rules.push(...(scopeRules[-1] || []));
      }

      const statics = template.statics;
      for (let j = 0; j < statics.length; j++) {
        const style = statics[j];
        rules.push(...style);
        for (var k = 0; k < templateRules.length; k++) {
          rules.push(...(templateRules[k][j] || []));
        }
      }
    }

    return rules;
  }

  const rootScope = createScope({
    exports: {},

    _get(template) {
      throw new Error('uninstantiated template');
    },

    _set(_, renderers, vars) {
      const acc = new Map();
      const cache = new Map();
      for (let i = 0; i < renderers.length; i++) {
        renderers[i](acc, vars, cache);
      }

      const rules = renderRoot(acc);

      backend(rules);
    },

    removeScope() {
      // TODO remove the root scope
    },
  }, new Map(), {});

  return rootScope;
}
