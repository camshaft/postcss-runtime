function fetchValues(deps, values, cache) {
  return deps.map(dep => {
    if (cache.has(dep)) return cache.get(dep);
    let fn = values.get(dep);
    if (!fn) {
      console.warn(`CSS variable not set: ${dep}`);
      fn = () => '';
    }
    const value = fn(values, cache);
    cache.set(dep, value);
    return value;
  });
}

function instanceFactory(createInstance, varDeps, statics) {
  return (imports) => {
    const exports = new Map();
    let render = () => null;

    function setRender(cb) {
      render = cb;
    }

    function exposeName(name, classes) {
      if (exports.has(name)) classes.unshift(exports.get(name));
      exports.set(name, classes.join(' '));
    }

    function expose(name, ...classes) {
      if (typeof name === 'string') {
        return exposeName(name, classes);
      }

      name.forEach((v, k) => {
        exposeName(k, [v]);
      });
    }

    const importExports = imports.map(i => i.exports);
    createInstance(setRender, expose, ...importExports);

    return {
      exports,
      render(values, cache) {
        let currentStatic = -1;
        const result = [];
        const prepend = result[currentStatic] = [];

        statics.forEach((rules, id) => {
          result[id] = [];
        });

        function inject(...css) {
          if (typeof css[0] === 'number') return currentStatic = css[0];

          const current = result[currentStatic];
          for (let i = 0; i < css.length; i++) {
            const rule = css[i];
            if (rule) current.push(rule);
          }
        }

        const depValues = fetchValues(varDeps, values, cache);
        render(inject, ...depValues);

        return result;
      },
    };
  };
}

export default function createStyle($, generateName, addImport) {
  const vars = new Map();
  const varDeps = [];
  const statics = [];
  const cssImports = [];
  let imports = [];
  let init = () => ({
    exports: new Map(),
    render: () => [],
  });

  function createStatic(...rules) {
    rules = rules.filter(r => r);
    return statics.push(rules) - 1;
  }

  function instance(createInstance, ...deps) {
    imports = deps
      .map((dep) => {
        // add a variable dependency
        if (typeof dep === 'string') {
          varDeps.push(dep);
          return false;
        }

        return addImport(dep);
      })
      .filter(i => i);

    init = instanceFactory(createInstance, varDeps, statics);
  }

  function define(name, value, ...deps) {
    if (typeof value === 'string') return vars.set(name, () => value);

    vars.set(name, (values, cache) => value(...fetchValues(deps, values, cache)));
  }

  function alias(source, target) {
    source = [source];
    vars.set(target, (values, cache) => fetchValues(source, values, cache)[0]);
  }

  function cssImport(string) {
    cssImports.push(string);
  }

  $(createStatic, generateName, instance, define, alias, cssImport);

  return {
    statics,
    init,
    vars,
    imports,
    cssImports,
    dependencies: new Set(varDeps),
    priority: $.priority || 0,
  };
}
