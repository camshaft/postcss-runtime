import camelcase from 'camelcase';
import isReserved from 'reserved-words';
import loaderUtils from 'loader-utils';

export function getLine(node) {
  if (!node) return -1;
  const source = node.source;
  if (!source) return -1;
  const start = source.start;
  if (!start) return -1;
  return start.line || -1;
}

export function formatPath (path, root) {
  if (!path || !loaderUtils.isUrlRequest(path, root)) return false;
  return loaderUtils.urlToRequest(path, root);
};

export const sheetName = '$';

export function formatExport(name) {
  name = camelcase(name);
  if (isReserved.check(name, '6-strict')) {
    name = `${name}$`;
  }
  return name;
}

export function mergeRaws(...nodes) {
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

export const escapeCSS = css =>
  String(css)
    .replace(/\\/g, '\\\\')
    .replace(/\$\{/g, '\\${');

export const formatVar = (name) => `$${camelcase(`var_${name}`)}`;
