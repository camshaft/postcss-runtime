function fetchValues(deps, vars) {
  return deps.map(dep => {
    const fn = vars[dep];
    return fn ? fn() : '__UNDEFINED__'
  });
}

module.exports = function toCSS($, vars, cache) {
  if (cache.has($)) return cache.get($);

  const id = cache.size;
  const statics = [];
  const locals = {};
  let $render = () => true;

  const mod = {
    imports: [],
    locals: locals,
    css: null,
    toString() {
      if (typeof mod.css === 'string') return mod.css;

      let currentStatic = 0;
      const result = {0: []};

      statics.forEach((s, i) => {
        result[i + 1] = [s];
      });

      function inject(css) {
        if (typeof css === 'number') currentStatic = css;
        else result[currentStatic].push(css);
      }

      const deps = fetchValues(dependencies, vars);
      $render(inject, ...deps);

      return mod.css = Object.keys(result).map((key) =>
        result[key].join('')
      ).join('');
    },
  };

  cache.set($, mod);
  let dependencies = [];

  function createStatic(css) {
    return statics.push(css);
  }

  function generateName(name) {
    return `EXPORTED_${id}_${name}`;
  }

  function factory(registerDynamic, ...deps) {
    const imports = deps.map((dep) => {
      if (typeof dep === 'string') {
        dependencies.push(dep);
        return false;
      }
      if (!cache.has(dep)) toCSS(dep, vars, cache);
      const m = cache.get(dep);
      mod.imports.push(m);
      return m.locals;
    }).filter(i => i);

    registerDynamic(render, expose, ...imports);
  }

  function define(name, value, ...deps) {
    if (typeof value === 'string') return vars[name] = () => value;

    vars[name] = () => value(fetchValues(deps, vars));
  }

  function alias(source, target) {
    source = [source];
    vars[target] = () => fetchValues(source, vars)[0];
  }

  function render(cb) {
    $render = cb;
  }

  function expose(name, ...classes) {
    if (typeof name === 'string') {
      if (locals[name]) classes.shift(locals[name]);
      locals[name] = classes.join(' ');
      return;
    }

    Object.assign(locals, name);
  }

  $(createStatic, generateName, factory, define, alias);

  return mod;
}
