const color = require.resolve('../src/color');

require("babel-register")({
  extensions: [".js", ".jscss"],
  cache: true,
  presets: [
    'es2015',
    'es2016',
    'es2017',
  ],
  plugins: [
    'transform-es2015-modules-commonjs',
  ],
  ignore: (filename) => {
    return filename !== color && !/\.jscss$/.test(filename);
  }
});

const should = require('should');
const Path = require('path');
const fs = require('mz/fs');
const glob = require('glob-promise');

const postcss = require('postcss');
const runtime = require('./runtime');

const root = __dirname + '/cases';

describe('postcss-runtime', () => {
  fs.readdirSync(root).forEach((name) => {
    const dir = Path.join(root, name);
    if (!fs.statSync(dir).isDirectory()) return;

    it(name, () => (
      glob('*.css', { cwd: dir })
        .then(files => compileFiles(files, dir))
        .then(() => loadCase(dir))
        .then(results => verify(...results))
    ));
  });
});

function compileFiles(files, dir) {
  return Promise.all(files.map((file) =>
    fs.readFile(Path.join(dir, file), 'utf8')
      .then(compile)
      .then(js =>
        fs.writeFile(
          Path.join(dir, file.replace(/\.css$/, '.jscss')),
          js
        )
      )
  ));
}

function loadCase(dir) {
  let vars = {};
  try {
    vars = require(Path.join(dir, 'vars.js'));
  } catch(e) {}

  let locals;
  try {
    locals = require(Path.join(dir, 'locals.js'));
  } catch(e) {}

  return Promise.all([
    loadExpected(dir, locals),
    loadActual(dir, vars),
  ]);
}

function verify(expected, actual) {
  should(actual.css).eql(expected.css);
  if (expected.locals) should(actual.locals).eql(expected.locals);
}

function loadExpected(dir, locals) {
  const path = Path.join(dir, 'expected.css');
  return fs.readFile(path, 'utf8')
    .then(beautify)
    .then(css => ({css: css, locals: locals}));
}

function loadActual(dir, vars) {
  const path = Path.join(dir, 'index.jscss');
  delete require.cache[path];
  const index = require(path);

  const baseVars = {}
  const result = runtime(index.$, baseVars, new Map());
  Object.keys(vars).forEach((k) => {
    const value = vars[k];
    baseVars[k] = () => value;
  });

  return beautify(toString(result, new Set()))
    .then(css => ({css: css, locals: result.locals}));
}

function toString(mod, used) {
  if (used.has(mod)) return '';
  used.add(mod);
  return mod.imports
    .map(i => toString(i, used))
    .concat([String(mod)])
    .join('\n');
}

function compile(css) {
  return postcss()
    .process(css, { stringifier: require('../') })
    .then((result) => String(result.css));
}

function beautify(css) {
  return postcss([ require('perfectionist') ])
    .process(css)
    .then((result) => String(result.css));
}
