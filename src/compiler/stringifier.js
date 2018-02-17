import postcss from 'postcss';
import processRoot from './process/index';
import processCustomRules from './process/custom-rules';
import generateImports from './generate/imports';
import generateConstants from './generate/constants';
import generateExports from './generate/exports';
import generateModule from './generate/module';
import { MESSAGES } from '../plugin';

export default class Stringifier {
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

  child() {
    const child = new Stringifier(this.builder, this.opts);
    Object.assign(child, this, {
      dependencies: new Map(),
      extends: new Map(),
      exports: new Map(),
      composes: new Map(),
      defines: new Map(),
      aliases: new Map(),
      staticNames: new Map(),
      dynamicNames: new Map(),
      customRules: new Map(),
    });
    return child;
  }

  stringify(root) {
    this.imports = [];
    this.cssImports = [];
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
    this.customRules = new Map();
    this.messages = root[MESSAGES] || [];

    [
      processCustomRules,
    ].forEach((fun) => {
      root = fun(root, this) || root;
    });

    root = processRoot(root, this);

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
