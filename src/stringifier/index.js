const postcss = require('postcss');
const nested = require('postcss-nested');
const values = require('postcss-values-parser');
const selectors = require('postcss-selector-parser');
const processImport = require('./process/import');
const processCustomRules = require('./process/custom-rules');
const processCustomProperties = require('./process/custom-properties');
const processCustomMedia = require('./process/custom-media');
const processExtends = require('./process/extends');
const processVar = require('./process/var');
const processColor = require('./process/color');
const processPartition = require('./process/partition');
const processExports = require('./process/exports');
const processUrl = require('./process/url');
const processComposes = require('./process/composes');
const generateImports = require('./generate/imports');
const generateConstants = require('./generate/constants');
const generateExports = require('./generate/exports');
const generateModule = require('./generate/module');

module.exports = class Stringifier {
  constructor(builder, opts = {}) {
    this.builder = builder;
    this.opts = opts;
  }

  import(path, name, reason) {
    const imports = this.imports;
    let imp = imports.find(i => i.path === path);
    if (!imp) {
      imp = {
        path: path,
        names: new Map(),
        reason: reason,
      };
      imports.push(imp);
    }
    if (!imp.names.has(name)) imp.names.set(name, reason);
    const get = this.getImport.bind(this, path, name);
    get.toString = get;
    return get;
  }

  getImport(path, name) {
    const imports = this.imports;
    const imp = imports.find(i => i.path === path);
    if (!imp) throw new Error(`${JSON.stringify(path)} not imported`);
    if (!imp.names.has(name)) throw new Error(`${name} from ${JSON.stringify(path)} not imported`);
    return imp.names.get(name);
  }

  compose(className, node) {
    let nodes = this.composes.get(className);
    if (!nodes) {
      nodes = new Set();
      this.composes.set(className, nodes);
    }
    nodes.add(node);
  }

  stringify(root) {
    this.imports = [];
    this.exports = new Map();
    this.constants = new Map();
    this.staticNames = new Map();
    this.dynamicNames = new Map();
    this.moduleImports = new Map();
    this.dependencies = new Map();
    this.extends = new Map();
    this.composes = new Map();
    this.defines = new Map();
    this.aliases = new Map();

    [
      processCustomRules,
    ].forEach((fun) => {
      root = fun(root, this) || root;
    });

    // un-nest selectors
    nested()(root),

    root.walk((node) => {
      switch (node.type) {
        case 'atrule':
          if (node.params) {
            node.params = values(node.params, { loose: true })
              .parse();
          }
          break;
        case 'rule':
          if (node.selector) {
            node.selector = selectors()
              .process(node.selector, { lossless: true })
              .res;
          }
          break;
        case 'decl':
          if (node.value) {
            node.value = values(node.value, { loose: true })
              .parse();
          }
          break;
        case 'comment':
          node.remove();
          break;
      }
    });

    [
      processColor,
      processUrl,
      processCustomProperties,
      processCustomMedia,
      processExtends,
      processImport,
      processVar,
      processPartition,
      processExports,
      processComposes,
    ].forEach((fun) => {
      root = fun(root, this) || root;
    });

    root.walk((node) => {
      const { nodes } = node;
      if (nodes && nodes.length === 0) node.remove();
    });

    [
      generateImports,
      generateConstants,
      generateExports,
      generateModule,
    ].forEach((fun) => {
      fun(this, this.builder, root);
    });
  }
}
