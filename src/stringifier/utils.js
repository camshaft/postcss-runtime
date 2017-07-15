const camelcase = require('camelcase');
const isReserved = require('reserved-words');
const loaderUtils = require('loader-utils');

exports.getLine = function getLine(node) {
  if (!node) return -1;
  const source = node.source;
  if (!source) return -1;
  const start = source.start;
  if (!start) return -1;
  return start.line || -1;
}

exports.formatPath = (path, root) => {
  if (!path || !loaderUtils.isUrlRequest(path, root)) return false;
  return loaderUtils.urlToRequest(path, root);
};

exports.sheetName = '$';

exports.formatExport = (name) => {
  name = camelcase(name);
  if (isReserved.check(name, '6-strict')) {
    name = `${name}$`;
  }
  return name;
}

exports.mergeRaws = (...nodes) => {
  const raw = {
    before: '',
    after: '',
  };

  nodes.forEach((node) => {
    const r = node.raws || node.spaces;

    raw.before = raw.before + (r.before || '');
    raw.after = (r.after || '') + raw.after;
  });
  return raw;
}

exports.escapeCSS = css =>
  String(css)
    .replace(/\\/g, '\\\\')
    .replace(/\$\{/g, '\\${');
