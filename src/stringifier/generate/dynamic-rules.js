const stringify = require('./sheet');
const stringifySelector = require('./selector');

module.exports = (compilation, builder, root) => {
  const dependencies = Array
    .from(compilation.dependencies.values())
    .map(dep => `, ${dep}`)
    .join('');

  if (!dependencies.length) {
    return builder('    // no dynamic rules\n');
  }

  builder(`    $render(($inject${dependencies}) => {\n`);
  const indent = '      ';

  function injectStatic(node) {
    const staticChunk = node.staticChunk;
    if (staticChunk) {
      builder(`${indent}$inject(${staticChunk});\n`, node);
    }
  }

  function injectApply(node) {
    clearBuffer(node);
    injectStatic(node);
    const varName = compilation.dependencies.get(node.apply);
    builder(`${indent}(${varName} || $noop)($inject, \``, node);
    stringifySelector(node.selector, builder);
    builder(`\`);\n`, node);
  }

  let buffer = [];
  function clearBuffer(node) {
    if (!buffer.length) return;
    injectStatic(buffer[0]);

    builder(`${indent}$inject(`, node, 'start');
    buffer.forEach((node, i) => {
      if (i) builder(', `');
      else builder('`');
      stringify(node, builder);
      builder('`');
    });
    builder(');\n', node, 'end');

    buffer = [];
  }

  root.each((node) => {
    if (!node.hasVar) return clearBuffer(node);
    if (node.apply) return injectApply(node);
    buffer.push(node);
  });
  clearBuffer();

  builder(`    });\n`);
};
