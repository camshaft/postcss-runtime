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
    return !/\.jscss$/.test(filename);
  }
});

const should = require('should');
const Path = require('path');
const fs = require('mz/fs');
const glob = require('glob-promise');

process.env.POSTCSS_RUNTIME_PATH = Path.dirname(__dirname);

const {
  createSheet,
  createTextBackend: createBackend,
} = compiler = require('..');

const postcss = require('postcss');

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
  if (expected.exports) should(actual.exports).eql(expected.exports);
}

function loadExpected(dir, exports) {
  const path = Path.join(dir, 'expected.css');
  return fs.readFile(path, 'utf8')
    .then(beautify)
    .then(css => ({ css, exports }));
}

function loadActual(dir, vars) {
  const path = Path.join(dir, 'index.jscss');

  const locals = new Map();
  Object.keys(vars).forEach((k) => {
    const value = vars[k];
    locals.set(k, () => value);
  });

  return renderModule(path, locals)
    .then(({ css, exports }) => {
      return beautify(css)
        .then(css => ({ css, exports }))
    });
}

function renderModule(path, locals) {
  delete require.cache[path];

  return new Promise((resolve) => {
    const theme = {};
    theme[path] = require(path);

    const backend = createBackend((css) => {
      resolve({
        css,
        exports: exports[path],
      })
    });

    let i = 0;
    function generateName() {
      const mod = i++;
      return (name) => `EXPORTED_${mod}_${name}`;
    }

    const sheet = createSheet(backend, generateName);

    const { exports, render } = sheet.createScope(locals, theme);
    render();
  });
}

function compile(css) {
  return postcss()
    .process(css, { stringifier: compiler })
    .then((result) => String(result.css));
}

function beautify(css) {
  return postcss([
      require('postcss-discard-comments'),
      require('perfectionist'),
    ])
    .process(css)
    .then((result) => String(result.css));
}
